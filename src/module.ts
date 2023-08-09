import semver from 'semver'
import * as helpers from './helpers'

/**
 * Represents a Terraform Module instance.
 * @property latestVersion The latest version of the Terraform Module.
 * @property refVersion The reference version of the Terraform Module.
 * @property sourceFile The path to the Terraform source file.
 * @property needsUpdate Indicates whether the Terraform source file needs to be updated.
 * @property latestVersionUrl The URL to the latest version of the Terraform Module.
 * @method isCurrentVersionGtRefVersion Checks if the current version of Terraform is greater than or equal to the reference version.
 */
export class Module {
  latestVersion: string // the latest version of the Terraform Module
  refVersion: string // the reference version of the Terraform Module
  sourceFile: string // the path to the Terraform source file
  needsUpdate: boolean // indicates whether the Terraform source file needs to be updated

  /**
   * Creates a new instance of the `Module` class.
   * @param sourceFile The path to the Terraform source file.
   * @param latestVersion The latest version of the Terraform Module.
   * @param refVersion The reference version of the Terraform Module.
   */
  constructor(sourceFile: string, latestVersion: string, refVersion: string) {
    this.sourceFile = sourceFile
    this.latestVersion = latestVersion
    this.refVersion = refVersion

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
