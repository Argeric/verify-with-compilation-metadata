import { Metadata, SolidityJsonInput } from "@ethereum-sourcify/lib-sourcify";
import { sendFormUrlEncodedRequest } from "./util";
import { createJsonInputFromMetadata } from "./standard-json-input";

function createJsonInputFromMetadataAndInput(metadata: Metadata, input: any):
  {
    fullQualifiedName: string
    compilerVersion: string
    solcJsonInput: SolidityJsonInput
  }
{
  const {
    fullQualifiedName,
    compilerVersion,
    solcJsonInput
  } = createJsonInputFromMetadata(metadata)

  // rewrite solcJsonInput.sources
  solcJsonInput.sources = {};
  if (!metadata.sources || Object.keys(metadata.sources).length != 1) {
    throw new Error('invalid_metadata_sources, sources should be provided at most 1 in metadata.sources');
  }
  if(!input.sources || Object.keys(input.sources).length != 1) {
    throw new Error('invalid_metadata_sources, sources should be provided at most 1 in input.sources');
  }
  const source = Object.keys(
    metadata.sources,
  )[0];
  solcJsonInput.sources[source] = {
    content: metadata.sources[source].content || input.sources[source].content
  }

  return {
    fullQualifiedName,
    compilerVersion,
    solcJsonInput,
  }
}

/**
 * sendSingleFileVerifyRequest
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
export async function sendSingleFileVerifyRequest(
  buildInfoFile: string,
  contractPath: string,
  contractName: string,
  contractAddress: string,
  url: string,
) {
  const buildinfo = require(buildInfoFile);
  const json = buildinfo.output.contracts[contractPath][contractName].metadata
  const metadata  = JSON.parse(json) as Metadata
  const input = buildinfo.input

  const {
    fullQualifiedName,
    compilerVersion,
    solcJsonInput
  } = createJsonInputFromMetadataAndInput(metadata, input)
  if(fullQualifiedName !== `${contractPath}:${contractName}`) {
    throw new Error(`Input params contractPath [${contractPath}] and contractName [${contractName}] not matched with metadata!`)
  }

  const formData = {
    module: 'contract',
    action: 'verifysourcecode',
    codeformat: 'solidity-single-file',
    contractaddress: contractAddress,
    contractname: contractName,
    compilerversion: compilerVersion,
    sourceCode: solcJsonInput.sources[contractPath].content,
    optimizationUsed: solcJsonInput.settings.optimizer.enabled ? 1 : 0,
    runs: solcJsonInput.settings.optimizer.runs,
    evmversion: solcJsonInput.settings.evmVersion,
  }
  await sendFormUrlEncodedRequest(
    {
      url,
      formData,
    }).then(resp => {
    console.log(`verify result \n${JSON.stringify(resp)}`)
  })
}
