const axios = require('axios');
const executionAndTraceService = require("onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService");
const logger = require('../LoggingService.js').getLogger();
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const requestUtil = require("./RequestUtil");
const {HTTP_SERVER} = require("onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes");

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

    let requestHeader = requestUtil.createRequestHeader(operationKey);
    let appInformation = requestUtil.getAppInformation();

    return await axios.post(targetUrl, payload, {
        headers: {
            'x-correlator': requestHeader.xCorrelator,
            'trace-indicator': requestHeader.traceIndicator,
            'user': requestHeader.user,
            'originator': requestHeader.originator,
            'customer-journey': requestHeader.customerJourney,
            'operation-key': requestHeader.operationKey
        }
    })
        .then((response) => {
            logger.debug(operationName + " success. result from axios call: " + response.status);

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
                targetUrl);

            return true;
        })
        .catch(e => {
            logger.error(e, "error during " + operationName);

            executionAndTraceService.recordServiceRequestFromClient(
                appInformation["application-name"],
                appInformation["release-number"],
                requestHeader.xCorrelator,
                requestHeader.traceIndicator,
                requestHeader.user,
                requestHeader.originator,
                operationName,
                e.response && e.response.status? e.response.status: responseCodeEnum.code.INTERNAL_SERVER_ERROR,
                payload,
                e,
                targetUrl);

            return false;
        });
}

exports.startPostDataRequest = async function (targetUrl, payload, operationName, operationKey) {

    let requestHeader = requestUtil.createRequestHeader(operationKey);
    let appInformation = requestUtil.getAppInformation();

    return await axios.post(targetUrl, payload, {
        headers: {
            'x-correlator': requestHeader.xCorrelator,
            'trace-indicator': requestHeader.traceIndicator,
            'user': requestHeader.user,
            'originator': requestHeader.originator,
            'customer-journey': requestHeader.customerJourney,
            'operation-key': requestHeader.operationKey
        }
    })
        .then((response) => {
            logger.debug(operationName + " success. result from axios call: " + response.status +
              " with data " + JSON.stringify(response.data));

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
                targetUrl);

            return {code: response.status, message: response.data, headers: requestHeader};
        })
        .catch(e => {
            logger.error(e, "error during " + operationName);
            let response = e.response ?? {status: responseCodeEnum.code.INTERNAL_SERVER_ERROR, data: e};

            executionAndTraceService.recordServiceRequestFromClient(
                appInformation["application-name"],
                appInformation["release-number"],
                requestHeader.xCorrelator,
                requestHeader.traceIndicator,
                requestHeader.user,
                requestHeader.originator,
                operationName,
                (e.response && e.response.status) ? e.response.status : responseCodeEnum.code.INTERNAL_SERVER_ERROR,
                payload,
                e,
                targetUrl);

            //throw e; // call handleError() in the upper catch handler in order to log using recordServiceRequest()
            return {code: response?.status, message: response?.data, headers: requestHeader};
        });
}


/**
 * Execute GET request and await success return value.
 *
 * @param targetUrl
 * @param operationName
 * @param operationKey
 * @return {Promise}
 */
exports.startGetRequest = async function (targetUrl, operationName, operationKey) {
    let requestHeader = requestUtil.createRequestHeader(operationKey);
    let appInformation = requestUtil.getAppInformation();

    return await axios.get(targetUrl, {
        headers: {
            'x-correlator': requestHeader.xCorrelator,
            'trace-indicator': requestHeader.traceIndicator,
            'user': requestHeader.user,
            'originator': requestHeader.originator,
            'customer-journey': requestHeader.customerJourney,
            'operation-key': requestHeader.operationKey
        }
    })
        .then((response) => {
            logger.debug(operationName + " success. result from axios call: " + response.status);

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
                targetUrl);

            return {code: response.status, message: response.data, headers: requestHeader};
        })
        .catch(e => {
            logger.error(e, "error during " + operationName);
            let response = e.response ?? {status: responseCodeEnum.code.INTERNAL_SERVER_ERROR, data: e};

            executionAndTraceService.recordServiceRequestFromClient(
                appInformation["application-name"],
                appInformation["release-number"],
                requestHeader.xCorrelator,
                requestHeader.traceIndicator,
                requestHeader.user,
                requestHeader.originator,
                operationName,
                response.status ?? responseCodeEnum.code.INTERNAL_SERVER_ERROR,
                undefined,
                response.data ?? e,
                targetUrl);

            //throw e; // call handleError() in the upper catch handler in order to log using recordServiceRequest()
            return {code: response?.status, message: response?.data, headers: requestHeader};
        });
}
