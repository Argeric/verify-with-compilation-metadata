import {readFile} from "node:fs/promises";
import {getJsonRequest, sendFormUrlEncodedRequest} from "../verification/util";

/*sendJsonInputVerifyRequestWithFile(
    `${__dirname}/0x6d23905497e01be20de6474b6b67dc3d43944cd1`,
    "contracts/Manager/MintManager.sol",
    "MintManager",
    "v0.8.9+commit.e5eed63a",
    '0x6d23905497e01be20de6474b6b67dc3d43944cd1',
    'https://evmapi-stage.confluxscan.net/api',
).catch(err => {
    console.error('verification error', err)
})*/

/*sendSingleFileVerifyRequestWithFile(
    `${__dirname}/0x0dcb0cb0120d355cde1ce56040be57add0185baa.singlefile`,
    'AnyswapV6Router',
    1,
    200,
    '',
    'v0.8.10+commit.fc410830',
    '0x0dcb0cb0120d355cde1ce56040be57add0185baa',
    'https://evmapi-stage.confluxscan.net/api',
).catch(err => {
    console.error('verification error', err)
})*/

checkVerifyStatus(
    "aa2fa0d4-7ab0-4704-89d1-9c56d9d3cf72",
    'https://evmapi-stage.confluxscan.net/api',
).catch(err => {
    console.error('checkVerifyStatus error', err)
})

export async function sendJsonInputVerifyRequestWithFile(
    stdJsonInput: string, // sourceCode
    contractPath: string, // name
    contractName: string, // name
    compilerVersion: string, // version
    contractAddress: string, // base32
    url: string,
) {
    const solcJsonInput = require(stdJsonInput);
    const fullQualifiedName = `${contractPath}:${contractName}`
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

export async function sendSingleFileVerifyRequestWithFile(
    singleFileInput: string, // sourceCode
    contractName: string, // name
    optimizationUsed: number = 0, // optimizeFlag
    runs: number = 200, // optimizeRuns
    evmversion: string = '', // evmVersion
    compilerVersion: string, // version
    contractAddress: string, // base32
    url: string,
) {
    const sourceCode = await readFile(singleFileInput, "utf-8");
    const formData = {
        module: 'contract',
        action: 'verifysourcecode',
        codeformat: 'solidity-single-file',
        contractaddress: contractAddress,
        contractname: contractName,
        compilerversion: compilerVersion,
        sourceCode,
        optimizationUsed,
        runs,
        evmversion,
    }
    await sendFormUrlEncodedRequest(
        {
            url,
            formData,
        }).then(resp => {
        console.log(`verify result \n${JSON.stringify(resp)}`)
    })
}

export async function checkVerifyStatus(
    guid: string,
    url: string,
) {
    const result = await getJsonRequest({
        url,
        queryParams: {
            module: 'contract',
            action: 'checkverifystatus',
            guid
        }
    })
    console.log('checkVerifyStatus ==', result)
}

