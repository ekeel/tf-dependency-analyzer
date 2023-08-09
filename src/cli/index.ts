import { FileHandler } from '../fileHandler';
import { findTerraformFiles } from '../helpers';

// main.ts

function parseArguments(args: string[]): Map<string, string> {
  const parsedArgs = new Map<string, string>();

  for (let i = 0; i < args.length - 1; i += 2) {
    const argName = args[i].replace(/^--/, '');
    const argValue = args[i + 1];
    parsedArgs.set(argName, argValue);
  }

  return parsedArgs;
}

async function main() {
  const args = process.argv.slice(2); // Exclude 'node' and script file name from arguments

  if (args.length === 0) {
    console.log('No arguments provided.');
    return;
  }

  const parsedArgs = parseArguments(args);
  if (!parsedArgs.has('dir')) {
    console.log('No dir argument provided.');
    return;
  }
  if (!parsedArgs.has('analyzeTerraform')) {
    console.log('No analyzeTerraform argument provided.');
    return;
  }
  if (!parsedArgs.has('analyzeProviders')) {
    console.log('No analyzeProviders argument provided.');
    return;
  }
  if (!parsedArgs.has('analyzeModules')) {
    console.log('No analyzeModules argument provided.');
    return;
  }
  if (!parsedArgs.has('githubPAT')) {
    if (!(process.env.TDU_GITHUB_PAT as string)) {
      console.log('No githubPAT argument provided and TDU_GITHUB_PAT is not set.');
      return;
    }
  }
  if (!parsedArgs.has('githubEnterprisePAT')) {
    if (!(process.env.TDU_GITHUB_ENTERPRISE_PAT as string)) {
      console.log('No githubEnterprisePAT argument provided and TDU_GITHUB_ENTERPRISE_PAT is not set.');
      return;
    }
  }

  const tfDir = parsedArgs.get('dir') as string;
  const analyzeTerraform = parsedArgs.get('analyzeTerraform') === 'true';
  const analyzeProviders = parsedArgs.get('analyzeProviders') === 'true';
  const analyzeModules = parsedArgs.get('analyzeModules') === 'true';
  const gitHubPAT = parsedArgs.get('githubPAT') as string ?? process.env.TDU_GITHUB_PAT as string;
  const gitHubEnterprisePAT = parsedArgs.get('githubEnterprisePAT') as string ?? process.env.TDU_GITHUB_ENTERPRISE_PAT as string;

  console.log("\nConfig:")
  console.log(`  TF Directory: ${tfDir}`);
  console.log(`  Analyze Terraform: ${analyzeTerraform}`);
  console.log(`  Analyze Providers: ${analyzeProviders}`);
  console.log(`  Analyze Modules: ${analyzeModules}\n`);

  const files = await findTerraformFiles(tfDir);

  let fileHandlers: FileHandler[] = [];

  for (const file of files) {
    const fileHandler = new FileHandler(file, gitHubPAT, gitHubEnterprisePAT, analyzeTerraform, analyzeProviders, analyzeModules, undefined);
    await fileHandler.populate();

    fileHandlers.push(fileHandler);
  }

  console.log(JSON.stringify(fileHandlers, null, 2));
}

main();
