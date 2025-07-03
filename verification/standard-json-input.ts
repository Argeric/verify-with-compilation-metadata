import { Libraries, Metadata, MetadataCompilerSettings, SolidityJsonInput } from "@ethereum-sourcify/lib-sourcify";
import { sendFormUrlEncodedRequest, splitFullyQualifiedName } from "./util";
import {MetadataSourceMap} from "@ethereum-sourcify/compilers-types/build/main/CompilationTypes";

export function createJsonInputFromMetadata(metadata: Metadata):
  {
    fullQualifiedName: string
    compilerVersion: string
    solcJsonInput: SolidityJsonInput
  }
{
  const settings = JSON.parse(JSON.stringify(metadata.settings)) as MetadataCompilerSettings
  const {
    libraries: metadataLibraries,
    compilationTarget,
    ...settingsWithoutLibraries
  } = settings
  if (!compilationTarget || Object.keys(compilationTarget).length != 1) {
    throw new Error('invalid_compilation_target');
  }

  const compilationTargetPath = Object.keys(
    settings.compilationTarget,
  )[0];
  const path = compilationTargetPath;
  const name = settings.compilationTarget[compilationTargetPath];
  const fullQualifiedName = `${path}:${name}`

  const compilerVersion = `v${metadata.compiler.version}`

  const solcJsonInput = {} as SolidityJsonInput
  solcJsonInput.language = metadata.language;

  solcJsonInput.settings = {
    ...settingsWithoutLibraries,
    outputSelection: {
      "*": {
        "*": ["*"],
        "": ["*"],
      },
    },
  }

  solcJsonInput.sources = {};
  for (const source in metadata.sources) {
    solcJsonInput.sources[source] = {
      content: metadata.sources[source].content,
    };
  }

  // Convert the libraries from the metadata format to the compiler_settings format
  // metadata format: "contracts/1_Storage.sol:Journal": "0x7d53f102f4d4aa014db4e10d6deec2009b3cda6b"
  // settings format: "contracts/1_Storage.sol": { Journal: "0x7d53f102f4d4aa014db4e10d6deec2009b3cda6b" }
  if (metadataLibraries) {
    solcJsonInput.settings.libraries = Object.keys(metadataLibraries,)
      .reduce((libraries, libraryKey) => {
        // Before Solidity v0.7.5: { "ERC20": "0x..."}
        if (!libraryKey.includes(':')) {
          if (!libraries['']) {
            libraries[''] = {}
          }
          // try using the global method, available for pre 0.7.5 versions
          libraries[''][libraryKey] = metadataLibraries[libraryKey];
          return libraries
        }

        // After Solidity v0.7.5: { "ERC20.sol:ERC20": "0x..."}
        const { contractPath, contractName } = splitFullyQualifiedName(libraryKey)
        if (!libraries[contractPath]) {
          libraries[contractPath] = {}
        }
        libraries[contractPath][contractName] = metadataLibraries[libraryKey]
        return libraries
      }, {} as Libraries)
  }

  return {
    fullQualifiedName,
    compilerVersion,
    solcJsonInput,
  }
}

/**
 * sendJsonInputVerifyRequest
 *
 * @param buildInfoFile
 *  The path of the build-info file output after hardhat compilation
 * @param contractPath
 *  The path of the contrat file. Usually could be seen in build-info.output.sources[contract-path]
 * @param contractName
 *  The name of the contract. Usually could be seen in build-info.output.sources[contract-path].[contract-name]
 * @param contractAddress
 *  The address of the contract.
 * @param url
 *  The URL of verify-sourcecode OpenAPI
 *  Mainnet:
 *    core space: https://api.confluxscan.org/contract/verifysourcecode
 *    evm space: https://evmapi.confluxscan.org/api
 *  Testnet:
 *    core space: https://api-testnet.confluxscan.org/contract/verifysourcecode
 *    evm space: https://evmapi-testnet.confluxscan.org/api
 */
export async function sendJsonInputVerifyRequest(
  buildInfoFile: string,
  contractPath: string,
  contractName: string,
  contractAddress: string,
  url: string,
) {
  const buildinfo = require(buildInfoFile);
  const json = buildinfo.output.contracts[contractPath][contractName].metadata
  const metadata  = JSON.parse(json) as Metadata
  metadata.sources = buildinfo.input.sources as MetadataSourceMap

  const {
    fullQualifiedName,
    compilerVersion,
    solcJsonInput
  } = createJsonInputFromMetadata(metadata)
  if(fullQualifiedName !== `${contractPath}:${contractName}`) {
    throw new Error(`Input params contractPath [${contractPath}] and contractName [${contractName}] not matched with metadata!`)
  }

  const formData = {
    module: 'contract',
    action: 'verifysourcecode',
    codeformat: 'solidity-standard-json-input',
    contractaddress: contractAddress,
    contractname: fullQualifiedName,
    compilerversion: compilerVersion,
    sourceCode: JSON.stringify(solcJsonInput),
  }
  await sendFormUrlEncodedRequest(
    {
      url,
      formData,
    }).then(resp => {
    console.log(`verify result \n${JSON.stringify(resp)}`)
  })
}
