//@ts-check
'use strict';

const basicServices = require('onf-core-model-ap-bs/basicServices/BasicServicesService');
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const restResponseHeader = require('onf-core-model-ap/applicationPattern/rest/server/ResponseHeader');
const restResponseBuilder = require('onf-core-model-ap/applicationPattern/rest/server/ResponseBuilder');
const executionAndTraceService = require('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');
const logger = require('../service/LoggingService.js').getLogger();

const NEW_RELEASE_FORWARDING_NAME = undefined;
const OLD_RELEASE_FORWARDING_NAME = 'PromptForEmbeddingCausesRequestForBequeathingData';

// Aufruf von recordServiceRequest mit Protokollierung der Laufzeit
async function recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument) {
  let execTime = await restResponseHeader.executionTimeInMilliseconds(startTime);
  execTime = execTime? Math.round(execTime): 0;
  void executionAndTraceService.recordServiceRequest(xCorrelator, traceIndicator, user, originator, req.url, responseCode, req.body, responseBodyToDocument, execTime);
}

module.exports.disposeRemaindersOfDeregisteredApplication = async function disposeRemaindersOfDeregisteredApplication (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.disposeRemaindersOfDeregisteredApplication(body, user, xCorrelator, traceIndicator, customerJourney, req.url);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.embedYourself = async function embedYourself(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.embedYourself(body, user, xCorrelator, traceIndicator, customerJourney, req.url);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.endSubscription = async function endSubscription(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.endSubscription(body, user, xCorrelator, traceIndicator, customerJourney, req.url);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.informAboutApplication = async function informAboutApplication(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.informAboutApplication();
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.informAboutApplicationInGenericRepresentation = async function informAboutApplicationInGenericRepresentation(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.informAboutApplicationInGenericRepresentation(req.url);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.informAboutPrecedingRelease = async function informAboutPrecedingRelease (req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.informAboutPrecedingRelease(OLD_RELEASE_FORWARDING_NAME);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.informAboutReleaseHistory = async function informAboutReleaseHistory(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.informAboutReleaseHistory();
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.informAboutReleaseHistoryInGenericRepresentation = async function informAboutReleaseHistoryInGenericRepresentation(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.informAboutReleaseHistoryInGenericRepresentation(req.url);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.inquireBasicAuthRequestApprovals = async function inquireBasicAuthRequestApprovals (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.inquireBasicAuthRequestApprovals(body, user, originator, xCorrelator, traceIndicator, customerJourney);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.inquireOamRequestApprovals = async function inquireOamRequestApprovals(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.inquireOamRequestApprovals(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.listLtpsAndFcs = async function listLtpsAndFcs(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.listLtpsAndFcs();
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.redirectOamRequestInformation = async function redirectOamRequestInformation(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.redirectOamRequestInformation(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.redirectServiceRequestInformation = async function redirectServiceRequestInformation(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.redirectServiceRequestInformation(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.redirectTopologyChangeInformation = async function redirectTopologyChangeInformation(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.redirectTopologyChangeInformation(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.registerYourself = async function registerYourself(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  if (Object.keys(req.body).length === 0) {
    body = req.body;
    user = req.headers["user"];
    originator = req.headers["originator"];
    xCorrelator = req.headers["x-correlator"];
    traceIndicator = req.headers["trace-indicator"];
    customerJourney = req.headers["customer-journey"];
  }
  try {
    responseBodyToDocument = await basicServices.registerYourself(body, user, xCorrelator, traceIndicator, customerJourney, req.url);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.startApplicationInGenericRepresentation = async function startApplicationInGenericRepresentation(req, res, next, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.startApplicationInGenericRepresentation(req.url);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.updateClient = async function updateClient(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.updateClient(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.UpdateClientOfSubsequentRelease = async function UpdateClientOfSubsequentRelease (req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.OK;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.updateClientOfSubsequentRelease(body, user, originator, xCorrelator, traceIndicator, customerJourney);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.updateOperationClient = async function updateOperationClient(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.updateOperationClient(body, user, xCorrelator, traceIndicator, customerJourney, req.url, NEW_RELEASE_FORWARDING_NAME);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};

module.exports.updateOperationKey = async function updateOperationKey(req, res, next, body, user, originator, xCorrelator, traceIndicator, customerJourney) {
  let startTime = process.hrtime();
  let responseCode = responseCodeEnum.code.NO_CONTENT;
  let responseBodyToDocument = {};
  try {
    responseBodyToDocument = await basicServices.updateOperationKey(body);
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url);
    restResponseBuilder.buildResponse(res, responseCode, responseBodyToDocument, responseHeader);
  } catch (responseBody) {
    let responseHeader = await restResponseHeader.createResponseHeader(xCorrelator, startTime, req.url, -1);
    let sentResp = restResponseBuilder.buildResponse(res, undefined, responseBody, responseHeader);
    responseCode = sentResp.code;
    responseBodyToDocument = sentResp.body;
  }
  await recordSvcRequest(startTime, xCorrelator, traceIndicator, user, originator, req, responseCode, responseBodyToDocument);
};


process.on('unhandledRejection', (reason, promise) => {
  logger.error(reason, 'Unhandled Rejection at:', promise);
});

process.on('uncaughtException', (reason) => {
  logger.error(reason, "Unhandled Exception");
});
