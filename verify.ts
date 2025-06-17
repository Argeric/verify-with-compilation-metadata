import { sendJsonInputVerifyRequest } from "./verification/standard-json-input";
import {sendSingleFileVerifyRequest} from "./verification/single-file";

// ******************************** code-format: Standard json input ********************************
// evm space
// build-info: ./verification/0d76fa1e0c3cdbb18d383e740a03426f
// open-api: https://evmapi-testnet-stage.confluxscan.org/api
// contracts/reward/ChunkLinearReward.sol:ChunkLinearReward:0x15EA79340DE75d7a7Dc87304B8a04D95f78eD506
// contracts/market/FixedPrice.sol:FixedPrice:0x0C0Af94B384ba3656755cd877a28F5a3d406Fb06
// contracts/dataFlow/FixedPriceFlow.sol:FixedPriceFlow:0xf69051CF06199b856e5E15e87021Dcb5aC12A899
// contracts/miner/Mine.sol:PoraMine:0xf1084A4E9d232D83f33daC3310913A00Ee21B5D4
// core space
// build-info: ./verification/0d76fa1e0c3cdbb18d383e740a03426f
// open-api: https://api-testnet.confluxscan.net/contract/verifysourcecode
// contracts/dataFlow/FixedPriceFlow.sol:FixedPriceFlow:0x8ADB395f313D6E85b6672f91C9F6800d970b55B3
sendJsonInputVerifyRequest(
`${__dirname}/verification/0d76fa1e0c3cdbb18d383e740a03426f`, // Fill in your build-info path. For example: ${__dirname}/artifacts/build-info/12345678901234567890123456789012
"contracts/miner/Mine.sol", // Fill in your contract path. Usually could be seen in build-info.output.sources[contract-path]
"PoraMine", // Fill in your contract name. Usually could be seen in build-info.output.sources[contract-path].[contract-name]
'0xf1084A4E9d232D83f33daC3310913A00Ee21B5D4', // Fill in your contract address
'https://evmapi-testnet-stage.confluxscan.org/api', // Fill in the URL of verify-sourcecode OpenAPI
).catch(err => {
  console.error('verification error', err)
})

// ************************************ code-format: Single file ************************************
// evm space
// build-info: ./verification/02fe6bf3803d3515766215d24eb50335
// open-api: https://evmapi-testnet-stage.confluxscan.org/api
// contracts/PRCC_Vesting.sol:PRCC_Vesting:0xb856d19c518d74ee36964179d82a1a6218d26012
// core space
// build-info: ./verification/02fe6bf3803d3515766215d24eb50335
// open-api: https://api-testnet.confluxscan.org/contract/verifysourcecode
// contracts/PRCC_Vesting.sol:PRCC_Vesting:0x80DbB86c7c1bAE053646570709cF68117a2E1574
sendSingleFileVerifyRequest(
    `${__dirname}/verification/02fe6bf3803d3515766215d24eb50335`, // Fill in your build-info path. For example: ${__dirname}/artifacts/build-info/12345678901234567890123456789012
    "contracts/PRCC_Vesting.sol", // Fill in your contract path. Usually could be seen in build-info.output.sources[contract-path]
    "PRCC_Vesting", // Fill in your contract name. Usually could be seen in build-info.output.sources[contract-path].[contract-name]
    '0xb856d19c518d74ee36964179d82a1a6218d26012', // Fill in your contract address.
    'https://evmapi-testnet-stage.confluxscan.org/api', // Fill in the URL of verify-sourcecode OpenAPI
).catch(err => {
  console.error('verification error', err)
})
