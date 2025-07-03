import {sendFormUrlEncodedRequest} from "../verification/util";

sendJsonInputVerifyRequestWithFile(
    `${__dirname}/0x6d23905497e01be20de6474b6b67dc3d43944cd1`,
    "contracts/Manager/MintManager.sol",
    "MintManager",
    "v0.8.9+commit.e5eed63a",
    '0x6d23905497e01be20de6474b6b67dc3d43944cd1',
    'https://evmapi-stage.confluxscan.net/api',
).catch(err => {
    console.error('verification error', err)
})

export async function sendJsonInputVerifyRequestWithFile(
    stdJsonInput: string,
    contractPath: string,
    contractName: string,
    compilerVersion: string,
    contractAddress: string,
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