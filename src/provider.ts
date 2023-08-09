import * as semver from 'semver'
import * as helpers from './helpers'

/**
 * Represents a Terraform Provider instance.
 * @property name The name of the Terraform Provider.
 * @property latestVersion The latest version of the Terraform Provider.
 * @property refVersion The reference version of the Terraform Provider.
 * @property sourceFile The path to the Terraform source file.
 * @property needsUpdate Indicates whether the Terraform source file needs to be updated.
 * @method isCurrentVersionGtRefVersion Checks if the current version of Terraform is greater than or equal to the reference version.
 */
export class Provider {
  name: string // the name of the Terraform Provider
  latestVersion: string // the latest version of the Terraform Provider
  refVersion: string // the reference version of the Terraform Provider
  sourceFile: string // the path to the Terraform source file
  needsUpdate: boolean // indicates whether the Terraform source file needs to be updated

  /**
   * Creates a new instance of the `Provider` class.
   */
  constructor(
    name: string,
    latestVersion: string,
    refVersion: string,
    sourceFile: string
  ) {
    this.name = name
    this.latestVersion = latestVersion
    this.refVersion = refVersion
    this.sourceFile = sourceFile

    this.needsUpdate = this.isLatestVersionGtRefVersion()
  }

  /**
   * Checks if the current version of Terraform module is greater than or equal to the reference version.
   * @returns `true` if the current version of Terraform is greater than or equal to the reference version, otherwise `false`.
   * @throws An error if the current version of Terraform is not a valid version.
   * @throws An error if the reference version of Terraform is not a valid version.
   */
  isLatestVersionGtRefVersion(): boolean {
    const currentVersion = this.latestVersion.match(helpers.versionRegex)
      ?.groups?.numVersion
    const refVersion = this.refVersion.match(helpers.versionRegex)?.groups
      ?.numVersion

    if (!currentVersion || !refVersion) {
      const message = !currentVersion
        ? 'Invalid current_version'
        : 'Invalid ref_version'
      throw new Error(message)
    }

    return semver.gt(currentVersion, refVersion)
  }
}
