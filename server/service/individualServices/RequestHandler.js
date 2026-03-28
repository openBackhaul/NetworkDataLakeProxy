const restClient = require('./RestClient');
const requestUtil = require("./RequestUtil");
const controlConstructUtils = require("./ControlConstructUtil");
const {HTTP_CODES} = require("./RestClient");
const logger = require('../LoggingService.js').getLogger();


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
 * Forward request to MWDI instance depending on use case.
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

    const targetUrl = buildTargetUrl(opData.protocol, opData.address, opData.port, operationUrl);

    logger.debug(`Forwarding post data request to '${targetUrl}'`);

    const ret = await restClient.startPostDataRequest(targetUrl, payload, requestUrl, opData.operationKey);

    return {
        ...ret,
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

    const targetUrl = buildTargetUrl(opData.protocol, opData.address, opData.port, operationUrl, fieldsFilter);

    logger.debug(`Forwarding get request to '${targetUrl}'`);

    const ret = await restClient.startGetRequest(targetUrl, requestUrl, opData.operationKey);

    return {
        ...ret,
        operationName: opData.operationName
    };
}
