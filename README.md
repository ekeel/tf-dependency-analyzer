# TF Dependency Analyzer

Allows for discovery of all provider, modules, and the terraform version from a Terraform directory.

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

- `file`: The path to the Terraform source file.
- `terraformInstances`: An array of `Terraform` instances.
- `providerInstances`: An array of `Provider` instances.
- `moduleInstances`: An array of `Module` instances.
- `updateTerraform`: A boolean indicating whether to update Terraform instances.
- `updateProviders`: A boolean indicating whether to update provider instances.
- `updateModules`: A boolean indicating whether to update module instances.
- `providerVersionMap`: A `Map` object containing provider names and their corresponding URLs.

### Methods

- `getFileContents(): string`: Gets the file contents.
- `populate()`: Populates the `terraformInstances`, `providerInstances`, and `moduleInstances` arrays.
- `getTerraformInstances()`: Parses the file contents and creates a `Terraform` instance if the file contains Terraform initialization code.
- `getModuleInstances()`: Parses the file contents and creates `Module` instances if the file contains modules.
- `getProviderInstances()`: Parses the file contents and creates `Provider` instances if the file contains providers.

## `Terraform` class

The `Terraform` class represents a Terraform instance.

### Properties

- `version`: The version of Terraform.
- `sourceFile`: The path to the Terraform source file.
- `needsUpdate`: Indicates whether the Terraform source file needs to be updated.

### Methods

- `isVersionGtRefVersion(refVersion: string): boolean`: Checks if the current version of Terraform is greater than or equal to the reference version.

## `Provider` class

The `Provider` class represents a Terraform provider.

### Properties

- `name`: The name of the provider.
- `latestVersion`: The latestVersion of the provider.
- `refVersion`: The reference version of the provider in the code.
- `sourceFile`: The path to the Terraform source file.
- `needsUpdate`: Indicates whether the Terraform source file needs to be updated.

### Methods

- `isVersionGtRefVersion(refVersion: string): boolean`: Checks if the latest version of the Terraform provider is greater than or equal to the reference version.

## `Module` class

The `Module` class represents a Terraform module.

### Properties

- `latestVersion`: The latestVersion of the module.
- `refVersion`: The reference version of the module in the code.
- `sourceFile`: The path to the Terraform source file.
- `needsUpdate`: Indicates whether the Terraform source file needs to be updated.
- `latestVersionUrl`: The URL to the latest version of the module.

### Methods

- `isVersionGtRefVersion(refVersion: string): boolean`: Checks if the latest version of the Terraform module is greater than or equal to the reference version.

## `helpers.ts'
