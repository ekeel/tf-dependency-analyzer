# TF Dependency Analyzer

Allows for discovery of all provider, modules, and the terraform version from a Terraform directory.

- [TF Dependency Analyzer](#tf-dependency-analyzer)
  - [Usage](#usage)
    - [Install](#install)
    - [Example](#example)
  - [`FileHandler` class](#filehandler-class)
    - [Properties](#properties)
    - [Methods](#methods)
  - [`Terraform` class](#terraform-class)
    - [Properties](#properties-1)
    - [Methods](#methods-1)
  - [`Provider` class](#provider-class)
    - [Properties](#properties-2)
    - [Methods](#methods-2)
  - [`Module` class](#module-class)
    - [Properties](#properties-3)
    - [Methods](#methods-3)
  - [`helpers.ts`](#helpersts)
    - [Regular Expressions](#regular-expressions)
    - [Methods](#methods-4)


## Usage

### Install

```
npm install tf-dependency-analyzer
```

### Example

```js
import * as tda from 'tf-dependency-analyzer';

// Find all terraform files in the directory.
const dir = path.join('__tests__', 'fixtures', 'empty');
const files = await tda.findTerraformFiles(dir);

const handlers: FileHandler[] = [];
for (const file of files) {
    const handler = new FileHandler(file, gitHubPAT, gitHubEnterprisePAT, true, true, true, undefined);
    await handler.populate();
    handlers.push(handler);
}
```

## `FileHandler` class

The `FileHandler` class is responsible for handling Terraform source files. It provides methods for parsing the file contents and creating instances of `Terraform`, `Module`, and `Provider` classes.

### Properties

- `file`
    - The path to the Terraform source file.
- `terraformInstances`
    - An array of `Terraform` instances.
- `providerInstances`
    - An array of `Provider` instances.
- `moduleInstances`
    - An array of `Module` instances.
- `analyzeTerraform`
    - A boolean indicating whether to analyze Terraform instances.
- `analyzeProviders`
    - A boolean indicating whether to analyze provider instances.
- `analyzeModules`
    - A boolean indicating whether to analyze module instances.
- `providerVersionMap`
    - A `Map` object containing provider names and their corresponding URLs.

### Methods

- `getFileContents(): string`
    - Gets the file contents.
- `populate()`
    - Populates the `terraformInstances`, `providerInstances`, and `moduleInstances` arrays.
- `getTerraformInstances()`
    - Parses the file contents and creates a `Terraform` instance if the file contains Terraform initialization code.
- `getModuleInstances()`
    - Parses the file contents and creates `Module` instances if the file contains modules.
- `getProviderInstances()`
    - Parses the file contents and creates `Provider` instances if the file contains providers.

## `Terraform` class

The `Terraform` class represents a Terraform instance.

### Properties

- `version`
    - The version of Terraform.
- `sourceFile`
    - The path to the Terraform source file.
- `needsUpdate`
    - Indicates whether the Terraform source file needs to be updated.

### Methods

- `isVersionGtRefVersion(refVersion: string): boolean`
    - Checks if the current version of Terraform is greater than or equal to the reference version.

## `Provider` class

The `Provider` class represents a Terraform provider.

### Properties

- `name`
    - The name of the provider.
- `latestVersion`
    - The latestVersion of the provider.
- `refVersion`
    - The reference version of the provider in the code.
- `sourceFile`
    - The path to the Terraform source file.
- `needsUpdate`
    - Indicates whether the Terraform source file needs to be updated.

### Methods

- `isVersionGtRefVersion(refVersion: string): boolean`
    - Checks if the latest version of the Terraform provider is greater than or equal to the reference version.

## `Module` class

The `Module` class represents a Terraform module.

### Properties

- `latestVersion`
    - The latestVersion of the module.
- `refVersion`
    - The reference version of the module in the code.
- `sourceFile`
    - The path to the Terraform source file.
- `needsUpdate`
    - Indicates whether the Terraform source file needs to be updated.
- `latestVersionUrl`
    - The URL to the latest version of the module.

### Methods

- `isVersionGtRefVersion(refVersion: string): boolean`
    - Checks if the latest version of the Terraform module is greater than or equal to the reference version.

## `helpers.ts`

The `helpers.ts` file contains helper functions and regular expressions.

### Regular Expressions

- `versionRegex`
    - Regular expression for matching a semantic version number
- `terraformRegex`
    - Regular expression for matching a required Terraform version in a .tf file
- `requiredProvidersRegex`
    - Regular expression for matching required providers in a .tf file
- `providerRegex`
    - Regular expression for matching a provider block in a .tf file
- `providerVersionRegex`
    - Regular expression for matching a provider version in a .tf file
- `providerNameRegex`
    - Regular expression for matching a provider name in a .tf file
- `providerSourceRegex`
    - Regular expression for matching a provider source in a .tf file
- `modRegex`
    - Regular expression for matching a module block in a .tf file
- `modSourceGitNoRef`
    - Regular expression for matching a Git source URL without a ref in a module block in a .tf file
- `modSourceGitRef`
    - Regular expression for matching a Git source URL with a ref in a module block in a .tf file
- `modSourceHttpsNoRef`
    - Regular expression for matching an HTTPS source URL without a ref in a module block in a .tf file
- `modSourceHttpsRef`
    - Regular expression for matching an HTTPS source URL with a ref in a module block in a .tf file

### Methods

- `findTerraformFiles(dir: string): Promise<string[]>`
    - Recursively searches a directory for Terraform configuration files with the `.tf` extension.
- `isDirectory(path: string): Promise<boolean>`
    - Checks if a path is a directory.
- `getCurrentTerraformVersion(): Promise<string>`
    - Retrieves the latest version of Terraform from the HashiCorp Checkpoint API.
- `getLatestModuleVersionUrl(source: string, gitHubPAT: string, gitHubEnterprisePAT: string): {url: string; authHeader: string; refVersion: string}`
    - Generates the URL to the latest version of the Terraform Module.
- `getLatestModuleVersion(url: string, authHeader: string): Promise<string>`
    - Retrieves the latest version of the Terraform Module from the GitHub API.
- `getLatestProviderVersionUrl(name: string, sourceOwner: string | undefined): string`
    - Generates the URL to the latest version of the Terraform Provider.
- `getLatestProviderVersion(url: string, gitHubPAT: string): Promise<string>`
    - Retrieves the latest version of the Terraform Provider from the GitHub API.
- `isUrlValid(url: string): Promise<boolean>`
    - Checks if a URL is valid.