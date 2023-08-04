import fs from 'fs'
import {Terraform} from './terraform'
import {Module} from './module'
import * as helpers from './helpers'
import {Provider} from './provider'

export class FileHandler {
  file: string
  terraformInstances: Terraform[]
  providerInstances: Provider[]
  moduleInstances: Module[]
  updateTerraform: boolean
  updateProviders: boolean
  updateModules: boolean
  providerVersionMap: Map<string, string>

  readonly fileContents: string
  private gitHubPAT: string
  private gitHubEnterprisePAT: string

  /**
   * Creates a new instance of the `FileHandler` class.
   * @param file The path to the Terraform source file.
   * @param updateTerraform Whether to update Terraform instances.
   * @param updateProviders Whether to update provider instances.
   * @param updateModules Whether to update module instances.
   */
  constructor(
    file: string,
    gitHubPAT: string | undefined,
    gitHubEnterprisePAT: string | undefined,
    updateTerraform: boolean,
    updateProviders: boolean,
    updateModules: boolean,
    providerVersionMap: Map<string, string> | undefined
  ) {
    this.file = file
    this.gitHubPAT = gitHubPAT ?? ''
    this.gitHubEnterprisePAT = gitHubEnterprisePAT ?? ''
    this.updateTerraform = updateTerraform
    this.updateProviders = updateProviders
    this.updateModules = updateModules
    this.providerVersionMap = providerVersionMap ?? new Map<string, string>()
    this.fileContents = this.getFileContents()

    this.terraformInstances = []
    this.providerInstances = []
    this.moduleInstances = []
  }

  /**
   * Gets the file contents.
   * @returns The file contents.
   */
  getFileContents(): string {
    return fs.readFileSync(this.file, 'utf8')
  }

  async populate() {
    if (this.updateTerraform) await this.getTerraformInstances()
    if (this.updateProviders) await this.getProviderInstances()
    if (this.updateModules) await this.getModuleInstances()
  }

  /**
   * Parses the file contents and creates a `Terraform` instance if the file contains Terraform code.
   */
  async getTerraformInstances() {
    let tfMatch = this.fileContents.match(helpers.terraformRegex)
    if (tfMatch && tfMatch.groups) {
      // Get the current Terraform version
      const currentVersion = await helpers.getCurrentTerraformVersion()
      console.debug(`Current Terraform version: ${currentVersion}`)

      // Create a new Terraform instance and add it to the array
      const tfInstance = new Terraform(
        this.file,
        currentVersion,
        tfMatch.groups.refVersion
      )
      this.terraformInstances.push(tfInstance)
    }
  }

  /**
   * Parses the file contents and creates `Module` instances if the file contains modules.
   * @param gitHubPAT A GitHub personal access token.
   * @param gitHubEnterprisePAT A GitHub Enterprise personal access token.
   */
  async getModuleInstances() {
    // Get the module matches from the file contents
    let moduleMatches = helpers.modRegex.exec(this.fileContents) //this.fileContents.match(helpers.modRegex);

    while (moduleMatches !== null) {
      // If the file contains modules with a source that matches the regex, create a `Module` instance with the latest version and the reference version
      if (moduleMatches.groups) {
        const glmvReturn = helpers.getLatestModuleVersionUrl(
          moduleMatches.groups.source,
          this.gitHubPAT,
          this.gitHubEnterprisePAT
        )
        const latestVersion = await helpers.getLatestModuleVersion(
          glmvReturn.url,
          glmvReturn.authHeader
        )

        const moduleInstance = new Module(
          this.file,
          latestVersion,
          glmvReturn.refVersion
        )

        this.moduleInstances.push(moduleInstance)
      }

      moduleMatches = helpers.modRegex.exec(this.fileContents)
    }
  }

  async getProviderInstances() {
    let requiredProvidersMatches = helpers.requiredProvidersRegex.exec(
      this.fileContents
    )

    if (requiredProvidersMatches && requiredProvidersMatches[0]) {
      let providerMatch = helpers.providerRegex.exec(
        requiredProvidersMatches[0]
      )

      while (providerMatch !== null) {
        const nameMatch = providerMatch[0].match(helpers.providerNameRegex)
        const refVersionMatch = providerMatch[0].match(
          helpers.providerVersionRegex
        )
        const sourceMatch = providerMatch[0].match(helpers.providerSourceRegex)

        if (nameMatch && nameMatch.groups) {
          if (refVersionMatch && refVersionMatch.groups) {
            let latestVersionUrl = ''

            if (sourceMatch && sourceMatch.groups) {
              latestVersionUrl = helpers.getLatestProviderVersionUrl(
                nameMatch.groups.name,
                sourceMatch.groups.owner
              )
            } else {
              latestVersionUrl = helpers.getLatestProviderVersionUrl(
                nameMatch.groups.name,
                undefined
              )
            }

            const isValidUrl = await helpers.isUrlValid(latestVersionUrl)

            if (isValidUrl) {
              let latestVersion = await helpers.getLatestProviderVersion(
                latestVersionUrl,
                this.gitHubPAT
              )
              const providerInstance = new Provider(
                nameMatch.groups.name.trim(),
                latestVersion,
                refVersionMatch.groups.refVersion.trim(),
                this.file
              )
              this.providerInstances.push(providerInstance)
            } else if (this.providerVersionMap.has(nameMatch.groups.name)) {
              const latestVersion = this.providerVersionMap.get(
                nameMatch.groups.name
              )

              if (
                !latestVersion ||
                latestVersion === '' ||
                latestVersion === undefined
              ) {
                console.log(
                  `Unable to automatically generate a URL for provider ${nameMatch.groups.name}. Please provide a URL in the providerVersionMap.`
                )
              } else {
                const providerInstance = new Provider(
                  nameMatch.groups.name.trim(),
                  latestVersion,
                  refVersionMatch.groups.refVersion.trim(),
                  this.file
                )
                console.log(providerInstance)
                this.providerInstances.push(providerInstance)
              }
            } else {
              console.log(
                `Unable to automatically generate a URL for provider ${nameMatch.groups.name}. Please provide a URL in the providerVersionMap.`
              )
            }
          } else {
            console.debug(
              `No version found for provider ${nameMatch.groups.name}. No need to update.`
            )
          }
        }

        providerMatch = helpers.providerRegex.exec(requiredProvidersMatches[0])
      }
    }
  }
}
