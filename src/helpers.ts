import path from 'path'
import fs from 'fs'
import https from 'https'
import {Terraform} from './terraform'
import {Module} from './module'

// Regular expression for matching a semantic version number
export const versionRegex = /^(?<operator>.*?)(?<numVersion>\d+\.\d+\.\d+)$/m

// Regular expression for matching a required Terraform version in a .tf file
export const terraformRegex =
  /terraform[\s\S]*?\{[\s\S]*?required_version\s*=\s*"(?<refVersion>.+?)"[\s\S]*?}/

// Regular expression for matching required providers in a .tf file
export const requiredProvidersRegex =
  /required_providers\s*{\s*((?:[a-zA-Z0-9_-]+)\s*=\s*{\s*(?:(?:source\s*=\s*"[^"]*")(?:\s*version\s*=\s*"[^"]*")?|(?:version\s*=\s*"[^"]*")(?:\s*source\s*=\s*"[^"]*")?)\s*}[\s\n]*)+\s*}/gm

// Regular expression for matching a provider block in a .tf file
export const providerRegex =
  /(?<name>[a-zA-Z0-9_-]+)\s*=\s*{\s*(?:(?:source\s*=\s*"[^"]*")(?:\s*version\s*=\s*"[^"]*")?|(?:version\s*=\s*"[^"]*")(?:\s*source\s*=\s*"[^"]*")?)/gm

// Regular expression for matching a provider version in a .tf file
export const providerVersionRegex = /version\s*=\s*"(?<refVersion>.*?)"/m

// Regular expression for matching a provider name in a .tf file
export const providerNameRegex = /(?<name>[a-zA-Z0-9_-]+)\s*=\s*{/m

// Regular expression for matching a provider source in a .tf file
export const providerSourceRegex = /source\s*=\s*"(?<owner>.*?)\/(?<name>.*?)"/m

// Regular expression for matching a module block in a .tf file
export const modRegex =
  /module\s*"(?<name>.*?)"\s*{[\s\S]*?source\s*=\s*"(?<source>.*?)"/gm

// Regular expression for matching a Git source URL without a ref in a module block in a .tf file
export const modSourceGitNoRef =
  /^git@(?<host>.*?):(?<owner>.*?)\/(?<repo>.*?)\.git/m

// Regular expression for matching a Git source URL with a ref in a module block in a .tf file
export const modSourceGitRef =
  /^git@(?<host>.*?):(?<owner>.*?)\/(?<repo>.*?)\.git[\s\S]*?ref=(?<refVersion>.*?)$/m

// Regular expression for matching an HTTPS source URL without a ref in a module block in a .tf file
export const modSourceHttpsNoRef =
  /^https:\/\/(?<host>.*?)\/(?<owner>.*?)\/(?<repo>.*?)\.git/m

// Regular expression for matching an HTTPS source URL with a ref in a module block in a .tf file
export const modSourceHttpsRef =
  /^https:\/\/(?<host>.*?)\/(?<owner>.*?)\/(?<repo>.*?)\.git[\s\S]*?ref=(?<refVersion>.*?)$/m

/**
 * Recursively searches a directory for Terraform configuration files with the `.tf` extension.
 * @param directory The directory path to search.
 * @returns A Promise that resolves to an array of Terraform file paths.
 */
export async function findTerraformFiles(directory: string): Promise<string[]> {
  return new Promise(async resolve => {
    const files: string[] = []

    // If the directory doesn't exist, return an empty array
    if (!(await isDirectory(directory))) {
      return files
    }

    // Get the directory contents
    const dirents = await fs.promises.readdir(directory, {withFileTypes: true})

    // Loop through each directory entry
    for (const dirent of dirents) {
      const fullPath = path.join(directory, dirent.name)

      // If the entry is a directory, recursively search it for Terraform files
      // Else if the entry is a file and has the `.tf` extension, add it to the array of files
      if (dirent.isDirectory()) {
        const subFiles = await findTerraformFiles(fullPath)
        files.push(...subFiles)
      } else if (dirent.isFile() && path.extname(fullPath) === '.tf') {
        files.push(fullPath)
      }
    }

    resolve(files)
  })
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
      const stats = await fs.promises.stat(directory)
      resolve(stats.isDirectory())
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // If the path doesn't exist, resolve the Promise with `false`
        resolve(false)
      }

      // If there's an error, reject the Promise with the error
      reject(error)
    }
  })
}

/**
 * Retrieves the latest version of Terraform from the HashiCorp Checkpoint API.
 * @returns A Promise that resolves to a string representing the latest version of Terraform.
 */
export async function getCurrentTerraformVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'update-terraform-action'
      }
    }

    https
      .get(
        'https://checkpoint-api.hashicorp.com/v1/check/terraform',
        options,
        response => {
          let data = ''

          response.on('data', chunk => {
            data += chunk
          })

          response.on('end', () => {
            const json = JSON.parse(data)
            resolve(`~> ${json.current_version}`)
          })
        }
      )
      .on('error', error => {
        reject(error)
      })
  })
}

/**
 * Generates the URL to the latest version of the Terraform Module.
 * @param source The source URL of the Terraform Module.
 * @returns The URL to the latest version of the Terraform Module.
 */
export function getLatestModuleVersionUrl(
  source: string,
  gitHubPAT: string,
  gitHubEnterprisePAT: string
): {url: string; authHeader: string; refVersion: string} {
  let url = ''
  let authHeader = ''
  let refVersion = ''
  let matches = undefined
  let hasRefVersion = false

  if (modSourceGitRef.test(source)) {
    matches = source.match(modSourceGitRef)
    hasRefVersion = true
  } else if (modSourceGitNoRef.test(source)) {
    matches = source.match(modSourceGitNoRef)
    hasRefVersion = false
  } else if (modSourceHttpsRef.test(source)) {
    matches = source.match(modSourceHttpsRef)
    hasRefVersion = true
  } else if (modSourceHttpsRef.test(source)) {
    matches = source.match(modSourceHttpsRef)
    hasRefVersion = false
  }

  if (matches && matches.groups) {
    let path = `/api/v3/repos/${matches.groups.owner}/${matches.groups.repo}/releases/latest`
    let host = matches.groups.host
    refVersion = matches.groups.refVersion

    if (host === 'github.com') {
      host = 'api.github.com'
      path = `/repos/${matches.groups.owner}/${matches.groups.repo}/releases/latest`
      authHeader = `Bearer ${gitHubPAT}`
    } else {
      authHeader = `Bearer ${gitHubEnterprisePAT}`
    }

    if (!gitHubPAT && !gitHubEnterprisePAT) authHeader = ''

    url = new URL(`https://${host}${path}`).toString()
    return {url, authHeader, refVersion}
  }

  return {url, authHeader, refVersion}
}

/**
 * Retrieves the latest version of the Terraform Module from GitHub.
 * @param url The URL to the latest version of the Terraform Module.
 * @param authHeader The Authorization header to use for the request.
 * @returns A Promise that resolves to a string representing the latest version of the Terraform Module.
 * @throws An error if the request fails.
 */
export async function getLatestModuleVersion(
  url: string,
  authHeader: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    let options = {}

    if (authHeader !== '') {
      options = {
        headers: {
          'User-Agent': 'update-terraform-action',
          Authorization: authHeader
        }
      }
    } else {
      options = {
        headers: {
          'User-Agent': 'update-terraform-action'
        }
      }
    }

    https
      .get(url, options, response => {
        let data = ''

        response.on('data', chunk => {
          data += chunk
        })

        response.on('end', () => {
          const json = JSON.parse(data)
          resolve(json.tag_name)
        })
      })
      .on('error', error => {
        reject(error)
      })
  })
}

/**
 * Generates the URL to the latest version of the Terraform Provider.
 * @param name The name of the Terraform Provider.
 * @param source The source of the Terraform Provider.
 * @returns The URL to the latest version of the Terraform Provider.
 */
export function getLatestProviderVersionUrl(
  name: string,
  sourceOwner: string | undefined
): string {
  if (!sourceOwner) sourceOwner = 'hashicorp'
  let url = `https://api.github.com/repos/${sourceOwner}/terraform-provider-${name}/releases/latest`
  return url
}

/**
 * Retrieves the latest version of the Terraform Provider from GitHub.
 * @param url The URL to the latest version of the Terraform Provider.
 * @returns A Promise that resolves to a string representing the latest version of the Terraform Provider.
 * @throws An error if the request fails.
 */
export async function getLatestProviderVersion(
  url: string,
  gitHubPAT: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'update-terraform-action',
        Authorization: `Bearer ${gitHubPAT}`
      }
    }

    https
      .get(url, options, response => {
        let data = ''

        response.on('data', chunk => {
          data += chunk
        })

        response.on('end', () => {
          const json = JSON.parse(data)
          resolve(json.tag_name.replace('v', ''))
        })
      })
      .on('error', error => {
        reject(error)
      })
  })
}

export async function isUrlValid(url: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    return response.ok
  } catch (error) {
    return false
  }
}
