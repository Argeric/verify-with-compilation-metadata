import {readFile} from "node:fs/promises";
import {getJsonRequest, postJsonRequest, sendFormUrlEncodedRequest} from "../verification/util";

// solidity json input => openapi
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

// solidity single file => openapi
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

// vyper json input => openapi
/*buildVyperStdJson_0x46f54628().then(request => {
    sendVyperJsonInputVerifyRequestWithFile(
        request.sourceCode,
        request.contractPath,
        request.contractName,
        request.compilerVersion,
        request.contractAddress,
        'https://evmapi-testnet-stage.confluxscan.net/api',
    ).catch(err => {
        console.error('verification error', err)
    })
})*/

// vyper single file => openapi
sendVyperSingleFileVerifyRequestWithFile(
    `${__dirname}/0x7db4b759fef3d7c8f489064c3d4aba30db8b0462.singlefile`,
    'CurveStableSwapNG',
    "vyper:0.3.10",
    "0x7db4b759fef3d7c8f489064c3d4aba30db8b0462",
    'shanghai',
    'https://evmapi-testnet-stage.confluxscan.net/api',
).catch(err => {
    console.error('verification error', err)
})

// check stats from openapi
/*checkVerifyStatus(
    "ad02924d-d1ba-465c-92f8-15de45ce776f",
    'https://evmapi-testnet-stage.confluxscan.net/api',
).catch(err => {
    console.error('checkVerifyStatus error', err)
})*/

// vyper json input => sourcify
/*buildVyperJson_0x46f54628().then(request => {
    sendJsonInputVerifyRequestWithFileToSourcify({
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
        console.log(`verify result ${JSON.stringify(resp)}`)
    })
}

export async function sendVyperJsonInputVerifyRequestWithFile(
    sourceCode: string, // sourceCode
    contractPath: string, // name
    contractName: string, // name
    compilerVersion: string, // version
    contractAddress: string, // base32
    url: string,
) {
    const fullQualifiedName = `${contractPath}:${contractName}`
    const formData = {
        module: 'contract',
        action: 'verifysourcecode',
        codeformat: 'vyper-json',
        contractaddress: contractAddress,
        contractname: fullQualifiedName,
        compilerversion: compilerVersion,
        sourceCode,
    }
    await sendFormUrlEncodedRequest(
        {
            url,
            formData,
        }).then(resp => {
        console.log(`verify result ${JSON.stringify(resp)}`)
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
        console.log(`verify result ${JSON.stringify(resp)}`)
    })
}

export async function sendVyperSingleFileVerifyRequestWithFile(
    singleFileInput: string, // sourceCode
    contractName: string, // name
    compilerVersion: string, // version
    contractAddress: string, // base32
    evmVersion: string,
    url: string,
) {
    const sourceCode = await readFile(singleFileInput, "utf-8");
    const formData = {
        module: 'contract',
        action: 'verifysourcecode',
        codeformat: 'vyper-single-file',
        contractaddress: contractAddress,
        contractname: contractName,
        compilerversion: compilerVersion,
        sourceCode,
        evmVersion,
    }
    await sendFormUrlEncodedRequest(
        {
            url,
            formData,
        }).then(resp => {
        console.log(`verify result ${JSON.stringify(resp)}`)
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

export async function sendJsonInputVerifyRequestWithFileToSourcify({
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
        console.log(`verify result ${JSON.stringify(resp)}`)
    })
}

async function buildSources(contracts: {[sourcePath: string]: string}) {
    const sources = {};
    for (const path of Object.keys(contracts)) {
        const content = await readFile(contracts[path], "utf-8");
        sources[path] = {content};
    }
    return sources
}


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

async function buildVyperJson_0x46f54628() {
    return {
        chainId: 71,
        address: "0x46f546285ffb981615973d598e2e54701269a6b6",
        compilerVersion: "0.3.9+commit.66b96705",
        contractIdentifier: '.:',
        creationTransactionHash: "0xe8b188a4bc1c0e6c675ef020bd399b59ad01f3408e719df45900e2253949d913",
        stdJsonInput: {
            language: "Vyper",
            sources: await buildSources({
                ".": "./Vyper20.vy",
            }),
            settings: {
            },
        }
    }
}

async function buildVyperStdJson_0x717Aac6d() {
    const stdJson = {
        language: "Vyper",
        sources: await buildSources({
            "src/ReceiverFactory.vy": "./ReceiverFactory/ReceiverFactory.vy",
            "lib/github/pcaversaccio/snekmate/src/snekmate/auth/ownable.vy": "./ReceiverFactory/ownable.vy",
            "lib/github/pcaversaccio/snekmate/src/snekmate/utils/create2_address.vy": "./ReceiverFactory/create2_address.vy",
            "src/interfaces/UntronReceiver.vyi": "./ReceiverFactory/UntronReceiver.vyi",
            "src/interfaces/UntronTransfers.vyi": "./ReceiverFactory/UntronTransfers.vyi",
        }),
        settings: {
            "outputSelection": {
                "src/ReceiverFactory.vy": [
                    "evm.bytecode",
                    "evm.deployedBytecode",
                    "abi"
                ]
            },
            "search_paths": [
                "."
            ]
        },
    }
    return {
        sourceCode: JSON.stringify(stdJson),
        compilerVersion: "vyper:0.4.0",
        contractPath: "src/ReceiverFactory.vy",
        contractName: "Untron Intents Receiver Factory",
        contractAddress: "0x717Aac6d019180c33009D61Db41d373C2e5B64AB",
    }
}
