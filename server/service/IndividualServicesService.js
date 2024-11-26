'use strict';

const bequeathHandler = require('./individualServices/BequeathHandler');
const requestHandler = require('./individualServices/RequestHandler');
const individualServicesUtility = require('./individualServices/IndividualServicesUtility');
const requestUtil = require("./individualServices/RequestUtil");
const controlConstructUtil = require("./individualServices/ControlConstructUtil");
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const logger = require('./LoggingService.js').getLogger();


/**
 * Initiates process of embedding a new release
 *
 * body V1_bequeathyourdataanddie_body
 * user String User identifier from the system starting the service call
 * originator String 'Identification for the system consuming the API, as defined in  [/core-model-1-4:control-construct/logical-termination-point={uuid}/layer-protocol=0/http-client-interface-1-0:http-client-interface-pac/http-client-interface-configuration/application-name]'
 * xCorrelator String UUID for the service execution flow that allows to correlate requests and responses
 * traceIndicator String Sequence of request numbers along the flow
 * customerJourney String Holds information supporting customer’s journey to which the execution applies
 * no response value expected for this operation
 **/
exports.bequeathYourDataAndDie = function(requestUrl,body,user,originator,xCorrelator,traceIndicator,customerJourney) {
  return new Promise(async function (resolve, reject) {
    try {
      let success = await bequeathHandler.handleRequest(body, requestUrl);

      if (success) {
        resolve();
      } else {
        reject(new Error("bequeathHandler.handleRequest failed."));
      }
    } catch (exception) {
      logger.error(exception, "bequeath was not successful");
      reject(exception);
    }
  });
}


/**
 * Provides list of devices that are connected to the controller
 * returns mount-name-list in ret.message
 **/
exports.provideListOfConnectedDevices = async function(requestUrl) {
  const ret = await requestHandler.postRequestDataFromMWDI(requestUrl, "PromptForProvidingListOfConnectedDeviceCausesReadingMwdiDeviceList", {});

  return ret;
}


let numberOfParallelRequests = 0;

let callHistory = [];

function removeOldCalls(date) {
  while(callHistory.length>0 && callHistory[0] < date) {
    callHistory.shift();
  }
}

function copyNode(nodeName, node, nodeExpression, filteredConstruct) {
  if (nodeName.match(nodeExpression)) {
    filteredConstruct[nodeName] = node;
  }
}

exports.filterControlConstruct = function filterControlConstruct(data) {
// Filter Control Construct
  // filter ControlConstruct data for:
  // - physical inventory (equipment, firmware)
  // - logical inventory (ltpConfiguration, profiles, forwarding)

  let cc = data["core-model-1-4:control-construct"];

  if (cc) {
    // gefilterte Daten
    let filtered = {"core-model-1-4:control-construct": []};
    let filteredConstruct = filtered["core-model-1-4:control-construct"];

    for(const elem of cc) {
      let newElem = {}

      for(const [nodeName, node] of Object.entries(elem)) {
        copyNode(nodeName, node, "equipment", newElem);
        copyNode(nodeName, node, /firmware.*/, newElem);
        copyNode(nodeName, node, "profile-collection", newElem);
        copyNode(nodeName, node, "forwarding-domain", newElem);
        copyNode(nodeName, node, "logical-termination-point", newElem);
      }

      filteredConstruct.push(newElem);
    }

    data = filtered;
  }

  return data;
}

/**
 * Provides inventory data of the device
 * body: Mount-name of the device, for which the inventory data shall be provided
 *
 * returns control construct of the device
 **/
exports.provideInventoryOfDevice = async function(requestUrl, body) {
  let callbackName = "RequestForProvidingInventoryDataOfDeviceCausesFilteredRequestToMwdi";

  // Throttling
  let maxNumberOfParallelCcRequests = await individualServicesUtility.getIntegerProfileInstanceValue("maxNumberOfParallelCcRequests");
  let maxNumberOfCcRequestsPerSecond = await individualServicesUtility.getIntegerProfileInstanceValue("maxNumberOfCcRequestsPerSecond");

  let now = new Date();
  removeOldCalls(now-1000);
  callHistory.push(now);

  ++numberOfParallelRequests;
  const numberOfRequestsPerSecond = callHistory.length;

  try {
    if (numberOfParallelRequests > maxNumberOfParallelCcRequests ||
      numberOfRequestsPerSecond > maxNumberOfCcRequestsPerSecond) {
      // rejection due to throttling
      let requestHeader = requestUtil.createRequestHeader(undefined);
      return {
        code: 429,
        message: "Too many requests. The maximum amount of requests that can executed in parallel or per second has been reached",
        header: requestHeader
      };
    }

    // The fields filter with the following value to be added to the request from
    // [/core-model-1-4:control-construct/profile-collection/profile=ndlp-1-0-1-string-p-000/string-profile-1-0:string-profile-pac/string-profile-configuration/string-value]
    // example: "[\"equipment-augment-1-0:control-construct-pac;top-level-equipment;equipment(uuid;operational-state;connector(local-id;equipment-augment-1-0:connector-pac(connector-kind;outside-label;sequence-id));contained-holder(occupying-fru;local-id;equipment-augment-1-0:holder-pac(vendor-label;outside-label;sequence-id));expected-equipment(structure(category);manufactured-thing(manufacturer-properties(manufacturer-name);equipment-type(part-type-identifier;version));local-id;operational-state);actual-equipment(structure(category);physical-properties(temperature);manufactured-thing(manufacturer-properties(manufacturer-name);equipment-type(part-type-identifier;version);equipment-instance(manufacture-date;serial-number));operational-state));firmware-1-0:firmware-collection;logical-termination-point(uuid;layer-protocol(local-id;layer-protocol-name;air-interface-2-0:air-interface-pac(air-interface-configuration);ethernet-container-2-0:ethernet-container-pac(ethernet-container-configuration);hybrid-mw-structure-2-0:hybrid-mw-structure-pac(hybrid-mw-structure-configuration);ip-interface-1-0:ip-interface-pac(ip-interface-configuration);mac-interface-1-0:mac-interface-pac(mac-interface-configuration);pure-ethernet-structure-2-0:pure-ethernet-structure-pac(pure-ethernet-structure-configuration);tdm-container-2-0:tdm-container-pac(tdm-container-configuration);vlan-interface-1-0:vlan-interface-pac(vlan-interface-configuration);wire-interface-2-0:wire-interface-pac(wire-interface-configuration)));profile-collection;forwarding-domain\"\]"

    let fieldsFilter = await controlConstructUtil.getProfileStringValueByName("RequestForProvidingInventoryDataOfDeviceCausesFilteredRequestToMwdi");

    let ret = await requestHandler.getDataFromMWDI(requestUrl, callbackName, body, fieldsFilter);

// filtering is done in the MWDI by the fields filter.
//    if (ret.code === responseCodeEnum.code.OK) {
//      ret.message = this.filterControlConstruct(ret.message);
//    }

    return ret;
  } finally {
    --numberOfParallelRequests;
  }
}
