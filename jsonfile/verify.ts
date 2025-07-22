import {readFile} from "node:fs/promises";
import {getJsonRequest, postJsonRequest, sendFormUrlEncodedRequest} from "../verification/util";

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

async function buildVyperJson_0xf73ab398() {
    return {
        chainId: 71,
        address: "0xf73ab3982b58b84e756bfc31af0db6c6aed0c62f",
        compilerVersion: "0.4.3+commit.bff19ea2",
        contractIdentifier: "0/1/contracts/MainnetBlockView.vy:MainnetBlockView",
        creationTransactionHash: "0xb7af61cbd7f4335ccd80fe7b997b5caadaa814cfbe1ea8b3d2cd5c38b178b622",
        stdJsonInput: {
            language: "Vyper",
            sources: await buildSources({
                "0/1/.venv/lib/python3.12/site-packages/snekmate/utils/block_hash.vy": "./block_hash.vy",
                "0/1/contracts/MainnetBlockView.vy": "./MainnetBlockView.vy"
            }),
            settings: {
                outputSelection: {
                    "0/1/contracts/MainnetBlockView.vy": [
                        "evm.bytecode",
                        "evm.deployedBytecode",
                        "abi"
                    ]
                },
                search_paths: [
                    "0/1/contracts",
                    "0/1",
                    "0/1/.venv/lib/python3.12/site-packages",
                    "."
                ],
                evmVersion: "paris"
            },
        }
    }
}

async function buildVyperJson_0x0065bae8() {
    return {
        chainId: 71,
        address: "0x0065bae817f2310d04724764baf66dcc25cce3ed",
        compilerVersion: "0.4.1+commit.8a93dd27",
        contractIdentifier: "src/send_and_receive_editions.vy:send_and_receive_editions",
        creationTransactionHash: "0x853c625c88cd12e35d3f359cc8ecf445e1b3a737809e0f87c4d87b560919db96",
        stdJsonInput: {
            language: "Vyper",
            sources: await buildSources({
                "src/send_and_receive_editions.vy": "./send_and_receive_editions.vy",
                ".venv/lib/python3.13/site-packages/snekmate/auth/ownable.vy": "./ownable.vy",
                ".venv/lib/python3.13/site-packages/snekmate/utils/pausable.vy": "./pausable.vy"
            }),
            settings: {
                outputSelection: {
                    "src/send_and_receive_editions.vy": [
                        "evm.bytecode",
                        "evm.deployedBytecode",
                        "abi"
                    ]
                },
                search_paths: [
                    ".venv/lib/python3.13/site-packages",
                    "."
                ],
            },
        }
    }
}

async function buildVyperJson_0x732fc2cc() {
    return {
        chainId: 71,
        address: "0x732fc2cc80303740a26c792e18f99538f6c72d52",
        compilerVersion: "0.3.10+commit.91361694",
        contractIdentifier: '.:',
        creationTransactionHash: "0x7dd17c165eb279439c12b53cd676902c07bade3d170a8d0eea84012fab3630ae",
        stdJsonInput: {
            language: "Vyper",
            sources: await buildSources({
                ".": "./CurveStableSwapNG.vy",
            }),
            settings: {
                evmVersion: "shanghai"
            },
        }
    }
}

buildVyperJson_0x732fc2cc().then(request => {
    sendMultiFilesVerifyRequestWithFile({
        url: `http://localhost:17651/verify/${request.chainId}/${request.address}`,
        stdJsonInput: request.stdJsonInput,
        compilerVersion: request.compilerVersion,
        contractIdentifier: request.contractIdentifier,
        creationTransactionHash: request.creationTransactionHash,
        licenseType: 1,
        contractLabel: 'contract-label'

    }).catch(err => {
        console.error('verification error', err)
    })
})

/*checkVerifyStatus(
    "aa2fa0d4-7ab0-4704-89d1-9c56d9d3cf72",
    'https://evmapi-stage.confluxscan.net/api',
).catch(err => {
    console.error('checkVerifyStatus error', err)
})*/

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

export async function sendMultiFilesVerifyRequestWithFile({
    url,
    stdJsonInput,
    compilerVersion,
    contractIdentifier,
    creationTransactionHash,
    licenseType,
    contractLabel,
}) {
    await postJsonRequest(
        {
            url,
            body: {
                stdJsonInput,
                compilerVersion,
                contractIdentifier,
                creationTransactionHash,
                licenseType,
                contractLabel,
            },
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

async function buildSources(contracts: {[sourcePath: string]: string}) {
    const sources = {};
    for (const path of Object.keys(contracts)) {
        const content = await readFile(contracts[path], "utf-8");
        sources[path] = {content};
    }
    return sources
}

