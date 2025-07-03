const superagent = require('superagent');
const { URLSearchParams } = require('url');

export function splitFullyQualifiedName(fullyQualifiedName: string): {
    contractPath: string;
    contractName: string;
} {
    const splitIdentifier = fullyQualifiedName.split(':');
    const contractName = splitIdentifier[splitIdentifier.length - 1];
    const contractPath = splitIdentifier.slice(0, -1).join(':');
    return { contractPath, contractName };
}

export async function sendFormUrlEncodedRequest(
    {
        url,
        formData,
        headers = {},
        timeout = 1000 * 60 * 3
    }) {
    try {
        const formBody = new URLSearchParams();
        Object.entries(formData).forEach(([key, value]) => {
            formBody.append(key, value);
        });

        const startTime = Date.now();
        console.info('Sending request', { url });

        const response = await superagent
            .post(url)
            .type('form')
            .set({
                'Content-Type': 'application/x-www-form-urlencoded',
                'accept': 'application/json',
                ...headers
            })
            .timeout(timeout)
            .send(formBody.toString());

        const duration = Date.now() - startTime;
        console.info('Request completed', {
            url,
            status: response.status,
            duration: `${duration}ms`
        });

        return {
            status: response.status,
            data: response.body,
            headers: response.headers
        };
    } catch (error) {
        console.error('Request failed', {
            url,
            error: error.message,
            stack: error.stack,
            response: error.response ? {
                status: error.response.status,
                body: error.response.body,
                headers: error.response.headers
            } : undefined
        });

        const err = new Error(error.message || 'HTTP request failed');
        err['code'] = error.status || 'HTTP_ERROR';
        err['response'] = error.response;
        throw err;
    }
}

export async function getJsonRequest(
    {
        url,
        queryParams = {},
        headers = {},
        timeout = 1000 * 30
    }) {
    try {
        const startTime = Date.now();
        console.info('Sending request', { url });

        let request = superagent.get(url).timeout(timeout).set({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...headers
        })
        if (queryParams && Object.keys(queryParams)?.length) {
            request = request.query(queryParams);
        }
        const response = await request

        const duration = Date.now() - startTime;
        console.info('Request completed', {
            url,
            status: response.status,
            duration: `${duration}ms`
        });

        return {
            status: response.status,
            data: response.body,
            headers: response.headers
        };
    } catch (error) {
        console.error('Request failed', {
            url,
            error: error.message,
            stack: error.stack,
            response: error.response ? {
                status: error.response.status,
                body: error.response.body,
                headers: error.response.headers
            } : undefined
        });

        const err = new Error(error.message || 'HTTP request failed');
        err['code'] = error.status || 'HTTP_ERROR';
        err['response'] = error.response;
        throw err;
    }
}