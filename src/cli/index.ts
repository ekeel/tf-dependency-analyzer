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
  if (!parsedArgs.has('updateTerraform')) {
    console.log('No updateTerraform argument provided.');
    return;
  }
  if (!parsedArgs.has('updateProviders')) {
    console.log('No updateProviders argument provided.');
    return;
  }
  if (!parsedArgs.has('updateModules')) {
    console.log('No updateModules argument provided.');
    return;
  }

  const tfDir = parsedArgs.get('dir') as string;
  const updateTerraform = parsedArgs.get('updateTerraform') === 'true';
  const updateProviders = parsedArgs.get('updateProviders') === 'true';
  const updateModules = parsedArgs.get('updateModules') === 'true';

  console.log("Config:")
  console.log(`  TF Directory: ${tfDir}`);
  console.log(`  Update Terraform: ${updateTerraform}`);
  console.log(`  Update Providers: ${updateProviders}`);
  console.log(`  Update Modules: ${updateModules}`);

  const gitHubPAT = process.env.TDU_GITHUB_PAT as string;
  const gitHubEnterprisePAT = process.env.TDU_GITHUB_ENTERPRISE_PAT as string;

  const files = await findTerraformFiles(tfDir);

  let fileHandlers: FileHandler[] = [];

  for (const file of files) {
    const fileHandler = new FileHandler(file, gitHubPAT, gitHubEnterprisePAT, updateTerraform, updateProviders, updateModules, undefined);
    await fileHandler.populate();

    fileHandlers.push(fileHandler);
  }

  console.log(JSON.stringify(fileHandlers, null, 2));
}

main();
