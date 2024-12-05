const axios = require('axios');
const executionAndTraceService = require("onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService");
const logger = require('../LoggingService.js').getLogger();
const requestUtil = require("./RequestUtil");


const HTTP_CODES = {
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    REQUEST_TIMEOUT: 408,
    INTERNAL_SERVER_ERROR: 500,
    BAD_GATEWAY: 502,
    BAD_GATEWAY_AUTHENTICATION: 531,
    BAD_GATEWAY_NOT_RESPONDING: 532
};

module.exports.HTTP_CODES = HTTP_CODES;


/**
 * Translate errors received when calling the upstream server.
 * @param ret
 * @returns {Object} An object containing:
 *  - {integer} code: The standardized status code.
 *  - {string} message: A human-readable message.
 */
function translateProxyResponse(ret) {
    // Ensure the response code is a valid number
    const code = Number(ret.code);

    if (isNaN(code)) {
        ret.code = HTTP_CODES.INTERNAL_SERVER_ERROR;
        ret.message = "Invalid response code received from upstream.";
    }
    // Translate specific codes
    else switch (code) {
        case HTTP_CODES.INTERNAL_SERVER_ERROR: // 500
            ret.code = HTTP_CODES.BAD_GATEWAY; // 502
            ret.message = "Bad Gateway";
            break;

        case HTTP_CODES.UNAUTHORIZED: // 401
        case HTTP_CODES.FORBIDDEN: // 403
            ret.code = HTTP_CODES.BAD_GATEWAY_AUTHENTICATION;
            ret.message = "Bad Gateway. Authentication at upstream server failed.";
            break;

        case HTTP_CODES.REQUEST_TIMEOUT: // 408
            ret.code = HTTP_CODES.BAD_GATEWAY_NOT_RESPONDING;
            ret.message = "Bad Gateway. Upstream server not responding.";
            break;
    }

    return ret;
}


/**
 * start sync post request and await success return value
 *
 * @param targetUrl
 * @param payload
 * @param operationName
 * @param operationKey
 * @return {Promise<boolean>}
 */
exports.startPostRequest = async function (targetUrl, payload, operationName, operationKey) {
    const requestHeader = requestUtil.createRequestHeader(operationKey);
    const appInformation = requestUtil.getAppInformation();

    try {
        const response = await axios.post(targetUrl, payload, {
            headers: {
                'x-correlator': requestHeader.xCorrelator,
                'trace-indicator': requestHeader.traceIndicator,
                'user': requestHeader.user,
                'originator': requestHeader.originator,
                'customer-journey': requestHeader.customerJourney,
                ...(requestHeader.operationKey && { 'operation-key': requestHeader.operationKey })
            }
        });

        logger.debug(`${operationName} success. Result: ${response.status}`);

        executionAndTraceService.recordServiceRequestFromClient(
          appInformation["application-name"],
          appInformation["release-number"],
          requestHeader.xCorrelator,
          requestHeader.traceIndicator,
          requestHeader.user,
          requestHeader.originator,
          operationName,
          response.status,
          payload,
          response.data,
          targetUrl
        );

        return true;
    } catch (e) {
        logger.error(`Error during ${operationName}: ${e.message}`, e);

        const status = e.response?.status || HTTP_CODES.BAD_GATEWAY;

        executionAndTraceService.recordServiceRequestFromClient(
          appInformation["application-name"],
          appInformation["release-number"],
          requestHeader.xCorrelator,
          requestHeader.traceIndicator,
          requestHeader.user,
          requestHeader.originator,
          operationName,
          status,
          payload,
          e.response?.data || e,
          targetUrl
        );

        return false;
    }
};


exports.startPostDataRequest = async function (targetUrl, payload, operationName, operationKey) {
    const requestHeader = requestUtil.createRequestHeader(operationKey);
    const appInformation = requestUtil.getAppInformation();

    let ret;

    try {
        const response = await axios.post(targetUrl, payload, {
            headers: {
                'x-correlator': requestHeader.xCorrelator,
                'trace-indicator': requestHeader.traceIndicator,
                'user': requestHeader.user,
                'originator': requestHeader.originator,
                'customer-journey': requestHeader.customerJourney,
                ...(requestHeader.operationKey && { 'operation-key': requestHeader.operationKey })
            }
        });

        logger.debug(`${operationName} success. Result: ${response.status} Data: ${JSON.stringify(response.data)}`);

        executionAndTraceService.recordServiceRequestFromClient(
          appInformation["application-name"],
          appInformation["release-number"],
          requestHeader.xCorrelator,
          requestHeader.traceIndicator,
          requestHeader.user,
          requestHeader.originator,
          operationName,
          response.status,
          payload,
          response.data,
          targetUrl
        );

        ret = { code: response.status, message: response.data, headers: requestHeader };
    } catch (e) {
        logger.error(`Error during ${operationName}: ${e.message}`, e);

        const status = e.response?.status || HTTP_CODES.BAD_GATEWAY;
        const data = e.response?.data || e;

        executionAndTraceService.recordServiceRequestFromClient(
          appInformation["application-name"],
          appInformation["release-number"],
          requestHeader.xCorrelator,
          requestHeader.traceIndicator,
          requestHeader.user,
          requestHeader.originator,
          operationName,
          status,
          payload,
          data,
          targetUrl
        );

        ret = { code: status, message: data, headers: requestHeader };
    }

    // Translate error codes
    const translatedResponse = translateProxyResponse(ret);
    logger.debug(`Translated response: ${JSON.stringify(translatedResponse)}`);

    return translatedResponse;
};


/**
 * Execute GET request and await success return value.
 *
 * @param targetUrl
 * @param operationName
 * @param operationKey
 * @return {Promise}
 */
exports.startGetRequest = async function (targetUrl, operationName, operationKey) {
    const requestHeader = requestUtil.createRequestHeader(operationKey);
    const appInformation = requestUtil.getAppInformation();

    let ret;

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'x-correlator': requestHeader.xCorrelator,
                'trace-indicator': requestHeader.traceIndicator,
                'user': requestHeader.user,
                'originator': requestHeader.originator,
                'customer-journey': requestHeader.customerJourney,
                ...(requestHeader.operationKey && { 'operation-key': requestHeader.operationKey })
            }
        });

        logger.debug(`${operationName} success. Result: ${response.status}`);

        executionAndTraceService.recordServiceRequestFromClient(
          appInformation["application-name"],
          appInformation["release-number"],
          requestHeader.xCorrelator,
          requestHeader.traceIndicator,
          requestHeader.user,
          requestHeader.originator,
          operationName,
          response.status,
          undefined,
          response.data,
          targetUrl
        );

        ret = { code: response.status, message: response.data, headers: requestHeader };
    } catch (e) {
        logger.error(`Error during ${operationName}: ${e.message}`, e);

        const status = e.response?.status || HTTP_CODES.BAD_GATEWAY;
        const data = e.response?.data || e;

        executionAndTraceService.recordServiceRequestFromClient(
          appInformation["application-name"],
          appInformation["release-number"],
          requestHeader.xCorrelator,
          requestHeader.traceIndicator,
          requestHeader.user,
          requestHeader.originator,
          operationName,
          status,
          undefined,
          data,
          targetUrl
        );

        ret = { code: status, message: data, headers: requestHeader };
    }

    // Translate error codes
    const translatedResponse = translateProxyResponse(ret);
    logger.debug(`Translated Response: ${JSON.stringify(translatedResponse)}`);

    return translatedResponse;
};
