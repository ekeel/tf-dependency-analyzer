import semver from 'semver';
import { findTerraformFiles, getTfInstanceFromFiles, versionRegex } from "./helpers";

/**
 * Represents a Terraform instance.
 * @property currentVersion The current version of Terraform.
 * @property refVersion The reference version of Terraform.
 * @property sourceFile The path to the Terraform source file.
 * @property needsUpdate Indicates whether the Terraform source file needs to be updated.
 * @method isCurrentVersionGtRefVersion Checks if the current version of Terraform is greater than or equal to the reference version.
 * @method getTfInstances Searches for terraform files, and returns an array of `Terraform` instances.
 */
export class Terraform {
  currentVersion: string; // the current version of Terraform
  refVersion: string; // the reference version of Terraform
  sourceFile: string; // the path to the Terraform source file
  needsUpdate: boolean; // indicates whether the Terraform source file needs to be updated

  /**
   * Creates a new instance of the `Terraform` class.
   * @param sourceFile The path to the Terraform source file.
   * @param currentVersion The current version of Terraform.
   * @param refVersion The reference version of Terraform.
   */
  constructor(sourceFile: string, currentVersion: string, refVersion: string) {
    this.sourceFile = sourceFile;
    this.currentVersion = currentVersion;
    this.refVersion = refVersion;
    this.needsUpdate = this.isCurrentVersionGtRefVersion();
  }

  /**
   * Searches for terraform files, and returns an array of `Terraform` instances.
   * @param directory The directory to search for Terraform files.
   */
  static async getTfInstances(directory: string): Promise<Terraform[]> {
    const files = await findTerraformFiles(directory);
    const tfInstances = await getTfInstanceFromFiles(files);

    return tfInstances;
  }

  /**
   * Checks if the current version of Terraform is greater than or equal to the reference version.
   * @returns `true` if the current version of Terraform is greater than or equal to the reference version, otherwise `false`.
   * @throws An error if the current version of Terraform is not a valid version.
   * @throws An error if the reference version of Terraform is not a valid version.
   */
  isCurrentVersionGtRefVersion(): boolean {
    const currentVersion = this.currentVersion.match(versionRegex)?.groups?.numVersion ?? '';
    const refVersion = this.refVersion.match(versionRegex)?.groups?.numVersion ?? '';

    if (!currentVersion || !refVersion) {
      const message = !currentVersion ? 'Invalid current_version' : 'Invalid ref_version';
      throw new Error(message);
    }

    return semver.gt(currentVersion, refVersion);
  }
}