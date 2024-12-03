const restClient = require('./RestClient');
const requestUtil = require("./RequestUtil");
const controlConstructUtils = require("./ControlConstructUtil");
const logger = require('../LoggingService.js').getLogger();


const HTTP_CODES = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    REQUEST_TIMEOUT: 408,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    BAD_GATEWAY_AUTHENTICATION: 531,
    BAD_GATEWAY_NOT_RESPONDING: 532
};


/**
 * Build target URL, optionally including a fields filter parameter.
 * @param protocol
 * @param address
 * @param port
 * @param operationUrl
 * @param fieldsFilter
 * @returns {string}
 */
function buildTargetUrl(protocol, address, port, operationUrl, fieldsFilter = undefined) {
    let url = requestUtil.buildRequestTargetPath(protocol, address, port) + operationUrl;

    if (fieldsFilter) {
        url += "?fields=" + encodeURIComponent(fieldsFilter);

        // Manually encode parentheses
        url = url.replaceAll("(", "%28").replaceAll(")", "%29");
    }
    return url;
}


/**
 * Translate errors received when calling the upstream server.
 * @param ret
 * @returns {Object} An object containing:
 *  - {integer} code: The standardized status code.
 *  - {string} message: A human-readable message.
 */
function translateProxyResponse(ret) {
    const code = Number(ret.code);

    if (isNaN(code)) {
        return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, message: "Invalid response code received from upstream." };
    }

    switch(code) {
        case HTTP_CODES.INTERNAL_SERVER_ERROR: // Internal Server Error
            // Response in case the server is acting as a gateway or proxy and
            // received an invalid response from the upstream server (device or application providing a consumed service)
            return { code: HTTP_CODES.BAD_GATEWAY, message: "Bad Gateway" };

        case HTTP_CODES.UNAUTHORIZED:
        case HTTP_CODES.FORBIDDEN:
            // Response in case the server is acting as a gateway or proxy and
            // was unable to authenticate at the upstream server (device or application providing a consumed service)
            return { code: HTTP_CODES.BAD_GATEWAY_AUTHENTICATION, message: "Bad Gateway. Authentication at upstream server failed." };

        case HTTP_CODES.REQUEST_TIMEOUT: // Request Timeout
            // Response in case the server is acting as a gateway or proxy and
            // was unable to connect to the upstream server (device or application providing a consumed service)
            return { code: HTTP_CODES.BAD_GATEWAY_NOT_RESPONDING, message: "Bad Gateway. Upstream server not responding." };

        default:
            return ret;
    }
}


/**
 * forward request to MWDI instance depending on use case
 *
 * @param requestUrl
 * @param callbackName
 * @param payload
 * @return {Promise<*|null>}
 */
exports.postRequestDataFromMWDI = async function(requestUrl, callbackName, payload) {
    let opData = await controlConstructUtils.getForwardingConstructOutputOperationData(callbackName);

    if (!opData) {
        const msg = `Operation data could not be queried for callback: ${callbackName}`;
        logger.error(msg);
        return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, message: msg };
    }

    let operationUrl = opData.operationName;

    const targetUrl = buildTargetUrl(opData.protocol, opData.address, opData.port, opData.operationName);

    logger.debug(`Forwarding post data request to '${targetUrl}'`);

    const ret = await restClient.startPostDataRequest(targetUrl, payload, requestUrl, opData.operationKey);

    // Translate error codes
    const retTranslated = translateProxyResponse({code: ret.code, message: ret.message});

    return {
        ...retTranslated,
        headers: ret.headers,
        operationName: opData.operationName
    };
}


/**
 * Forward request to MWDI.
 * @param requestUrl
 * @param callbackName
 * @param payload
 * @param fieldsFilter
 * @returns {Promise}
 */
exports.getDataFromMWDI = async function (requestUrl, callbackName, payload, fieldsFilter=undefined) {
    let opData = await controlConstructUtils.getForwardingConstructOutputOperationData(callbackName);
    if (!opData) {
        const msg = `Operation data could not be queried for callback: ${callbackName}`;
        logger.error(msg);
        return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, message: msg };
    }

    let operationUrl = opData.operationName;

    if (operationUrl.includes("{mountName}")) {
        const mountName = payload["mount-name"];

        if (!mountName) {
            const msg = "Missing required 'mount-name' in payload.";
            logger.error(msg);
            return { code: HTTP_CODES.INTERNAL_SERVER_ERROR, message: msg };
        }

        operationUrl = operationUrl.replace("{mountName}", mountName);
    }

    const targetUrl = buildTargetUrl(opData.protocol, opData.address, opData.port, opData.operationName, fieldsFilter);

    logger.debug(`Forwarding get request to '${targetUrl}'`);

    const ret = await restClient.startGetRequest(targetUrl, requestUrl, opData.operationKey);

    // Translate error codes
    const retTranslated = translateProxyResponse({code: ret.code, message: ret.message});

    return {
        ...retTranslated,
        headers: ret.headers,
        operationName: opData.operationName
    };
}
