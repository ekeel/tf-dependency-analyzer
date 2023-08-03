import path from 'path';
import { Terraform } from '../src/terraform';
import { findTerraformFiles, getTfInstanceFromFiles, versionRegex } from '../src/helpers';

const gitHubPAT = process.env.TDU_GITHUB_PAT as string;

const testFiles = [
  path.join('__tests__', 'fixtures', 'terraformModulesProviders.tf'),
  path.join('__tests__', 'fixtures', 'terraformOnly.tf'),
  path.join('__tests__', 'fixtures', 'terraformProviders.tf'),
  path.join('__tests__', 'fixtures', 'empty', 'empty.tf')
];

describe('helpers', () => {
  describe('findTerraformFiles', () => {
    it('should return an array of Terraform files', async () => {
      const dir = path.join('__tests__', 'fixtures');
      const files = await findTerraformFiles(dir);
      expect(files).toHaveLength(testFiles.length);
      expect(files).toEqual(expect.arrayContaining(testFiles));
    });

    it('should return an empty array if no Terraform files are found', async () => {
      const dir = path.join('__tests__', 'fixtures', 'empty');
      const files = await findTerraformFiles(dir);
      expect(files).toEqual([testFiles[3]]);
    });
  });

  describe('getTfInstanceFromFiles', () => {
    it('should return an array of Terraform instances', async () => {
      const files = [testFiles[0]];
      const tfInstances = await getTfInstanceFromFiles(files);
      
      expect(tfInstances.length).toEqual(1);
      expect(tfInstances[0].currentVersion).toMatch(versionRegex);
      expect(tfInstances[0].refVersion).toMatch(versionRegex);
      expect(tfInstances[0].sourceFile).toEqual(`${files[0]}`);
      expect(tfInstances[0].needsUpdate).toEqual(true);
    });
  
    it('should return an empty array if no Terraform instances are found', async () => {
      const files = [testFiles[3]];
      const tfInstances = await getTfInstanceFromFiles(files);
      expect(tfInstances).toEqual([]);
    });
  });
});