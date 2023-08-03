import path from "path";
import fs from "fs";
import https from 'https';
import { Terraform } from "./terraform";
import { Module } from "./module";

export const terraformRegex = /terraform[\s\S]*?\{[\s\S]*?required_version\s*=\s*"(?<refVersion>.+?)"[\s\S]*?}/;

export const versionRegex = /^.*?(?<numVersion>\d+\.\d+\.\d+)$/m;

export const modRegex = /module\s*"(?<name>.*?)"\s*{[\s\S]*?source\s*=\s*"(?<source>.*?)"/gm;
export const modSourceGitRegex= /^git@(?<host>[a-zA-Z0-9._-]+):(?<owner>[a-zA-Z0-9._-]+)\/(?<repo>[a-zA-Z0-9._-]+)\.git.*?\?ref=(?<refVersion>[a-zA-Z0-9._-]+)$/;
export const modSourceGitHttpsRegex = /^git::https:\/\/(?<host>.*)\/(?<owner>.*)\/(?<repo>.*)\.git\?ref=.*$/;
export const modSourceGitSshRegex = /^git::ssh:\/\/(?<host>.*)\/(?<owner>.*)\/(?<repo>.*)\.git\?ref=(?<ref>.*)$/m;
export const modSourceGitSubDirRegex = /^git::http:\/\/(?<host>.*)\/(?<owner>.*)\/(?<repo>.*)\.git\?ref=(?<ref>.*)$/m;

/**
 * Recursively searches a directory for Terraform configuration files with the `.tf` extension.
 * @param directory The directory path to search.
 * @returns A Promise that resolves to an array of Terraform file paths.
 */
export async function findTerraformFiles(directory: string): Promise<string[]> {
  return new Promise(async (resolve) => {
    const files: string[] = [];

    // If the directory doesn't exist, return an empty array
    if (!await isDirectory(directory)) {
      return files;
    }

    // Get the directory contents
    const dirents = await fs.promises.readdir(directory, { withFileTypes: true });

    // Loop through each directory entry
    for (const dirent of dirents) {
      const fullPath = path.join(directory, dirent.name);

      // If the entry is a directory, recursively search it for Terraform files
      // Else if the entry is a file and has the `.tf` extension, add it to the array of files
      if (dirent.isDirectory()) {
        const subFiles = await findTerraformFiles(fullPath);
        files.push(...subFiles);
      } else if (dirent.isFile() && path.extname(fullPath) === '.tf') {
        files.push(fullPath);
      }
    }

    resolve(files);
  });
}

/**
 * Checks if a given path is a directory.
 * @param directory The directory path to check.
 * @returns A boolean indicating whether the path is a directory or not.
 */
async function isDirectory(directory: string): Promise<boolean> {
  return new Promise(async (resolve, reject) => {
    try {
      // Resolve the Promise with a boolean indicating whether the path is a directory or not
      const stats = await fs.promises.stat(directory);
      resolve(stats.isDirectory());
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // If the path doesn't exist, resolve the Promise with `false`
        resolve(false);
      }

      // If there's an error, reject the Promise with the error
      reject(error);
    }
  });
}

/**
 * Gets the current version of Terraform from the HashiCorp checkpoint API.
 * @returns A Promise that resolves to the current version of Terraform.
 */
async function getCurrentTerraformVersion(): Promise<string> {
  // Make a GET request to the HashiCorp checkpoint API to get the current version of Terraform
  return new Promise((resolve, reject) => {
    const requestOptions = {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'tdu'
      },
    };

    https.get('https://checkpoint-api.hashicorp.com/v1/check/terraform', requestOptions, (resp: any) => {
      let data = '';
      
      // Concatenate the response data chunks
      resp.on('data', (chunk: string) => {
        data += chunk;
      });

      // When the response ends, parse the JSON data and resolve the Promise with the current version of Terraform
      resp.on('end', () => {
        const version = JSON.parse(data).current_version;
        resolve(version);
      });
    }).on('error', (err: any) => {
      // If there's an error with the request, reject the Promise with the error
      reject(err);
    });
  });
}

/**
 * Gets an array of `Terraform` instances from an array of Terraform source files.
 * @param files An array of file paths to Terraform source files.
 * @returns A promise that resolves to an array of `Terraform` instances.
 */
export async function getTfInstanceFromFiles(files: string[]): Promise<Terraform[]> {
  return new Promise(async (resolve) => {
    const tfInstances: Terraform[] = [];

    // Loop through each file and create a `Terraform` instance for each one
    for (const file of files) {
      const fileContents = await fs.promises.readFile(file, 'utf8');
      const refVersionMatch = fileContents.match(terraformRegex);

      // If the file contains a required version of Terraform, create a `Terraform` instance with the current version and the required version
      if (refVersionMatch && refVersionMatch.groups) {
        const currentVersion = await getCurrentTerraformVersion();
        const tfInstance = new Terraform(file, currentVersion, refVersionMatch.groups.refVersion);
        tfInstances.push(tfInstance);
      }
    }

    resolve(tfInstances);
  });
}

/**
 * Gets an array of `Module` instances from an array of Terraform source files.
 * @param files An array of file paths to Terraform source files.
 * @param gitHubPAT A GitHub personal access token.
 * @returns A promise that resolves to an array of `Module` instances.
 * @throws An error if the latest version of the Terraform Module is not a valid version.
 * @throws An error if the reference version of the Terraform Module is not a valid version.
 * @throws An error if the GitHub API returns an error.
 * @throws An error if the GitHub API returns an invalid response.
 */
export async function getModuleInstancesFromFiles(files: string[], gitHubPAT: string): Promise<Module[]> {
  return new Promise(async (resolve, reject) => {
      try {
          const moduleInstances: Module[] = [];

          // Loop through each file and create a `Module` instance for each one
          for (const file of files) {
              const fileContents = await fs.promises.readFile(file, 'utf8');
              const moduleMatches = fileContents.match(modRegex);

              if (moduleMatches && moduleMatches.groups) {
                const latestVersion = ''
                const moduleInstance = new Module(file, latestVersion, moduleMatches.groups.refVersion);
              }

              // // If the file contains modules with a source that matches the regex, create a `Module` instance with the latest version and the reference version
              // if (moduleMatches && moduleMatches.groups) {
              //     const latestVersion = await getLatestModuleVersion(moduleMatches.groups.owner, moduleMatches.groups.name, gitHubPAT);
              //     const moduleInstance = new Module(file, latestVersion, refVersionMatch.groups.version);
              //     moduleInstances.push(moduleInstance);
              // }
          }

          resolve(moduleInstances);
      }
      catch (error: unknown) {
          reject(error);
      }
  });
}