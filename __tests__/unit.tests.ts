import path from 'path'
import fs from 'fs'
import {Terraform} from '../src/terraform'
import {
  findTerraformFiles,
  getLatestModuleVersionUrl,
  versionRegex
} from '../src/helpers'
import {FileHandler} from '../src/fileHandler'
import {Module} from '../src/module'
import {Provider} from '../src/provider'

const gitHubPAT = process.env.TDU_GITHUB_PAT as string
const gitHubEnterprisePAT = process.env.TDU_GITHUB_ENTERPRISE_PAT as string

const emptyTestFile = path.join('__tests__', 'fixtures', 'empty', 'empty.tf')
const fullTestFile = path.join(
  '__tests__',
  'fixtures',
  'terraformModulesProviders.tf'
)

const testFiles = [
  fullTestFile,
  path.join('__tests__', 'fixtures', 'terraformOnly.tf'),
  path.join('__tests__', 'fixtures', 'terraformProviders.tf'),
  emptyTestFile
]

describe('helpers', () => {
  describe('findTerraformFiles', () => {
    it('should return an array of Terraform files', async () => {
      const dir = path.join('__tests__', 'fixtures')
      const files = await findTerraformFiles(dir)
      expect(files).toHaveLength(testFiles.length)
      expect(files).toEqual(expect.arrayContaining(testFiles))
    })

    it('should return an empty array if no Terraform files are found', async () => {
      const dir = path.join('__tests__', 'fixtures', 'empty')
      const files = await findTerraformFiles(dir)
      expect(files).toEqual([emptyTestFile])
    })
  })

  describe('getLatestModuleVersionUrl', () => {
    const testSource =
      'git@github.com:hashicorp/terraform-aws-vpc.git?ref=v2.0.0'

    it('should return the correct URL and auth header for a GitHub source', () => {
      const {url, authHeader} = getLatestModuleVersionUrl(
        testSource,
        gitHubPAT,
        gitHubEnterprisePAT
      )
      expect(url).toEqual(
        'https://api.github.com/repos/hashicorp/terraform-aws-vpc/releases/latest'
      )
      expect(authHeader).toEqual(`Bearer ${gitHubPAT}`)
    })

    it('should return the correct URL and auth header for a GitHub Enterprise source', () => {
      const testEnterpriseSource =
        'git@github.example.com:hashicorp/terraform-aws-vpc.git?ref=v2.0.0'
      const {url, authHeader, refVersion} = getLatestModuleVersionUrl(
        testEnterpriseSource,
        gitHubPAT,
        gitHubEnterprisePAT
      )
      expect(url).toEqual(
        'https://github.example.com/api/v3/repos/hashicorp/terraform-aws-vpc/releases/latest'
      )
      expect(authHeader).toEqual(`Bearer ${gitHubEnterprisePAT}`)
    })

    it('should return an empty URL and auth header for an invalid source', () => {
      const {url, authHeader} = getLatestModuleVersionUrl(
        'invalid-source',
        gitHubPAT,
        gitHubEnterprisePAT
      )
      expect(url).toEqual('')
      expect(authHeader).toEqual('')
    })
  })
})

describe('FileHandler', () => {
  const testFile = fullTestFile
  
  it('should create a new Terraform, Module, and Provider instance if the file contains providers', async () => {
    const fileHandler = new FileHandler(
      testFile,
      gitHubPAT,
      gitHubEnterprisePAT,
      true,
      true,
      true,
      undefined
    )
    await fileHandler.populate()

    expect(fileHandler).toBeInstanceOf(FileHandler)
    expect(fileHandler.fileContents.length).toBeGreaterThan(0)

    expect(fileHandler.providerInstances.length).toEqual(1)
    expect(fileHandler.providerInstances[0]).toBeInstanceOf(Provider)
    expect(fileHandler.providerInstances[0].sourceFile).toEqual(testFile)
    expect(fileHandler.providerInstances[0].latestVersion).toMatch(versionRegex)
    expect(fileHandler.providerInstances[0].refVersion).toMatch(versionRegex)
    expect(fileHandler.providerInstances[0].needsUpdate).toEqual(true)

    expect(fileHandler.moduleInstances.length).toEqual(1)
    expect(fileHandler.moduleInstances[0]).toBeInstanceOf(Module)
    expect(fileHandler.moduleInstances[0].sourceFile).toEqual(testFile)
    expect(fileHandler.moduleInstances[0].latestVersion).toMatch(versionRegex)
    expect(fileHandler.moduleInstances[0].refVersion).toMatch(versionRegex)
    expect(fileHandler.moduleInstances[0].needsUpdate).toEqual(true)

    expect(fileHandler.terraformInstances.length).toEqual(1)
    expect(fileHandler.terraformInstances[0]).toBeInstanceOf(Terraform)
    expect(fileHandler.terraformInstances[0].sourceFile).toEqual(testFile)
    expect(fileHandler.terraformInstances[0].currentVersion).toMatch(
      versionRegex
    )
    expect(fileHandler.terraformInstances[0].refVersion).toMatch(versionRegex)
    expect(fileHandler.terraformInstances[0].needsUpdate).toEqual(true)
  })
})
