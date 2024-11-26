'use strict';

const executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
const individualServices = require('../service/IndividualServicesService');
const responseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const restResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');
const operationServerInterface = require('onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/OperationServerInterface');
const onfAttributeFormatter = require("onf-core-model-ap/applicationPattern/onfModel/utility/OnfAttributeFormatter");
const requestUtil = require("../service/individualServices/RequestUtil");
const logger = require('../service/LoggingService.js').getLogger();
const httpErrors = require('http-errors');


function removeParametersFromString(str) {
  const tokens = str.split('?');
  return tokens[0];
}

// Call recordServiceRequest including the execution time
async function recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument) {
  let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  execTime = execTime? Math.round(execTime): 0;
  void executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument, execTime);
}

/**
 * Build response in case of errors.
 * @param startTime
 * @param error
 * @param req
 * @param res
 * @returns {Promise<void>}
 */
const handleError = async function handleError(startTime, error, req, res) {
  let responseHeader = {};

  let cleanedUrl = removeParametersFromString(req.url);
  let operationServerUuid = await operationServerInterface.getOperationServerUuidAsync(cleanedUrl);
  if (operationServerUuid) {
    let lifeCycleState = await operationServerInterface.getLifeCycleState(operationServerUuid);
    responseHeader.lifeCycleState = lifeCycleState;
  } else {
    logger.warn("operationServerUuid not found: ", cleanedUrl);
  }

  let errorResponse = buildErrorResponse(res, error, responseHeader);

  if (responseHeader) {
    let requestHeader = requestUtil.createRequestHeader();

    await recordSvcRequest(startTime, requestHeader.xCorrelator, requestHeader.traceIndicator, "NetworkDataLakeProxy",
      requestHeader.originator, req, errorResponse.code, errorResponse.body)
  }
}


/**
 * Build response of forwarded calls.
 * @param startTime
 * @param req
 * @param res
 * @param ret
 * @returns {Promise<{headers: Object, code: number, body: {code: number, message: (*|string)}}>}
 */
const handleForwardedResult = async function handleForwardedResult(startTime, req, res, ret) {
  let responseHeader = {};

  let operationServerUuid = null;

  if (ret.operationName) {
    operationServerUuid = await operationServerInterface.getOperationServerUuidAsync(ret.operationName);
  }

  if (!operationServerUuid) {
    let cleanedUrl = removeParametersFromString(req.url);
    operationServerUuid = await operationServerInterface.getOperationServerUuidAsync(cleanedUrl);
  }

  if (operationServerUuid) {
    let lifeCycleState = await operationServerInterface.getLifeCycleState(operationServerUuid);
    responseHeader.lifeCycleState = lifeCycleState;
  } else {
    logger.warn("operationServerUuid not found: ", ret.operationName);
  }

  let forwardResponse = buildForwardedResponse(res, ret.code, ret.message, responseHeader);

  let requestHeader = requestUtil.createRequestHeader();
  await recordSvcRequest(startTime, requestHeader.xCorrelator, requestHeader.traceIndicator, "NetworkDataLakeProxy",
    requestHeader.originator, req, ret.code, ret.message)

  return forwardResponse;
};

function buildMessage(body) {
  if (body?.message) {
    return body.message;
  } else if (body) {
    return body;
  } else {
    return httpErrors.InternalServerError().message;
  }
}

/**
 * Build response from received response.
 * @param response
 * @param responseCode
 * @param responseBody
 * @param responseHeader
 */
function buildForwardedResponse(response, responseCode, responseBody, responseHeader) {
  if (responseBody?.statusCode && typeof responseBody.statusCode==='number' && responseBody?.message) {
    responseCode = responseBody.statusCode;

    responseBody = {
      code: responseCode,
      message: responseBody.message
    }
  } else {
    if (responseCode === undefined) {
      responseCode = 500;
    }

    // In error cases we return code/message objects as response.
    if (responseCode !== 200 && responseCode !== 204) {
      responseBody = {
        code: responseCode,
        message: buildMessage(responseBody)
      }
    }
  }

  let headers;

  if (responseHeader !== undefined) {
    headers = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(responseHeader);
    response.set(headers);
  }

  response.status(responseCode).json(responseBody);

  return {
    code: responseCode,
    headers: headers,
    body: responseBody
  }
}

/**
 * Build response from error.
 * @param response
 * @param error
 * @param responseHeader
 * @returns {{headers, code: number, body: {code: number, message}}}
 */
function buildErrorResponse(response, error, responseHeader) {
  let responseCode = responseCodeEnum.code.INTERNAL_SERVER_ERROR;
  let msg = error?.message? error.message: error;

  if (error?.response?.data?.message)
    msg += ": " + error.response.data.message;

  let responseBody = {
    code: responseCode,
    message: msg
  }

  let headers;

  if (responseHeader !== undefined) {
    headers = onfAttributeFormatter.modifyJsonObjectKeysToKebabCase(responseHeader);
    response.set(headers);
  }

  response.status(responseCode).json(responseBody);

  return {
    code: responseCode,
    headers: headers,
    body: responseBody
  }
}


 // Handler for /v1/bequeath-your-data-and-die
module.exports.bequeathYourDataAndDie = async function bequeathYourDataAndDie(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  const startTime = process.hrtime();

  try {
    const response = await individualServices.bequeathYourDataAndDie(req.url, body, user, originator, xCorrelator, traceIndicator, customerJourney);

    const responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    const responseCode = responseCodeEnum.code.NO_CONTENT;

    responseBuilder.buildResponse(res, responseCode, response, responseHeader);
    await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, response)
  } catch (error) {
    return handleError(startTime, error, req, res);
  }
};


 // Handler for /v1/provide-list-of-connected-devices
module.exports.provideListOfConnectedDevices = async function provideListOfConnectedDevices(req, res, next) {
  let startTime = process.hrtime();

  try {
    const ret = await individualServices.provideListOfConnectedDevices(req.url);
    return handleForwardedResult(startTime, req, res, ret);
  } catch (error) {
    return handleError(startTime, error, req, res);
  }
};


 // Handler for /v1/provide-inventory-data-of-device
module.exports.provideInventoryOfDevice = async function provideInventoryOfDevice (req, res, next, body) {
  let startTime = process.hrtime();

  try {
    const ret = await individualServices.provideInventoryOfDevice(req.url, body);
    return handleForwardedResult(startTime, req, res, ret);
  } catch (error) {
    return handleError(startTime, error, req, res);
  }
};
