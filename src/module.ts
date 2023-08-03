import { findTerraformFiles, modSourceGitHttpsRegex, modSourceGitRegex, modSourceGitSshRegex, modSourceGitSubDirRegex } from "./helpers";

/**
 * Represents a Terraform Module instance.
 * @property latestVersion The latest version of the Terraform Module.
 * @property refVersion The reference version of the Terraform Module.
 * @property sourceFile The path to the Terraform source file.
 * @property needsUpdate Indicates whether the Terraform source file needs to be updated.
 * @property latestVersionUrl The URL to the latest version of the Terraform Module.
 * @method isCurrentVersionGtRefVersion Checks if the current version of Terraform is greater than or equal to the reference version.
 * @method getModuleInstances Searches for terraform files, and returns an array of `Module` instances.
 */
export class Module {
    latestVersion: string; // the latest version of the Terraform Module
    refVersion: string; // the reference version of the Terraform Module
    sourceFile: string; // the path to the Terraform source file
    needsUpdate: boolean; // indicates whether the Terraform source file needs to be updated
    latestVersionUrl: string; // the URL to the latest version of the Terraform Module

    /**
     * Creates a new instance of the `Module` class.
     * @param sourceFile The path to the Terraform source file.
     * @param latestVersion The latest version of the Terraform Module.
     * @param refVersion The reference version of the Terraform Module.
     */
    constructor(sourceFile: string, latestVersion: string, refVersion: string) {
        this.sourceFile = sourceFile;
        this.latestVersion = latestVersion;
        this.refVersion = refVersion;

        this.needsUpdate = false;//this.isCurrentVersionGtRefVersion();
        this.latestVersionUrl = ''; //this.getLatestVersionUrl();
    }

    /**
     * Generates the URL to the latest version of the Terraform Module.
     * @returns The URL to the latest version of the Terraform Module.
     */
    private getLatestVersionUrl(source: string): string {
        let url = '';

        if (modSourceGitRegex.test(source)) {
        }
        else if (modSourceGitHttpsRegex.test(source)) {
        }
        else if (modSourceGitSshRegex.test(source)) {
        }
        else if (modSourceGitSubDirRegex.test(source)) {
        }

        return url;
    }

    /**
     * Searches for terraform files, and returns an array of `Module` instances.
     * @param directory The directory to search for Terraform files.
     * @returns A Promise that resolves to an array of `Module` instances.
     * @throws An error if the latest version of the Terraform Module is not a valid version.
     * @throws An error if the reference version of the Terraform Module is not a valid version.
     */
    static async getModuleInstances(directory: string): Promise<Module[]> {
        return new Promise(async (resolve, reject) => {
            try {
                const files = await findTerraformFiles(directory);
                // const moduleInstances = await getModuleInstanceFromFiles(files);

                // resolve(moduleInstances);
            }
            catch (error: unknown) {
                reject(error);
            }
        });
    }
}
