'use strict';

const bequeathHandler = require('./individualServices/BequeathHandler');
const requestHandler = require('./individualServices/RequestHandler');
const individualServicesUtility = require('./individualServices/IndividualServicesUtility');
const requestUtil = require("./individualServices/RequestUtil");
const controlConstructUtil = require("./individualServices/ControlConstructUtil");
const responseCodeEnum = require('onf-core-model-ap/applicationPattern/rest/server/ResponseCode');
const logger = require('./LoggingService.js').getLogger();
const fs = require('fs');
const yaml = require('js-yaml');
const Ajv = require('ajv');
const $RefParser = require('@apidevtools/json-schema-ref-parser');


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

// Filter Control Construct
exports.filterControlConstructByNodes = function filterControlConstruct(data) {
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


// load YAML schema and prepare the `$ref` resolution
const loadOpenAPISchema = async (filePath) => {
  const yamlContent = fs.readFileSync(filePath, 'utf8');
  const schema = yaml.load(yamlContent);

  // resolve `$ref` references
  return $RefParser.dereference(schema);
}

let cachedValidationFilter = undefined;

async function getValidationFilter() {
  if (!cachedValidationFilter) {
    try {
      const schemaPath = 'api/openapi.yaml'; // OpenAPI Spec path
      const responseSchema = 'inline_response_200_1'; // response schema of /v1/provide-inventory-data-of-device

      const openAPISchema = await loadOpenAPISchema(schemaPath);
      const schema = openAPISchema.components.schemas[responseSchema];

      const ajv = new Ajv({
          strict: false,
          allErrors: true,
          // remove additional fields not matching the schema (mostly useless because of the additionalProperties option)
          removeAdditional: true
      });

      // Compile the specific schema
      cachedValidationFilter = ajv.compile(schema);
    } catch (exception) {
      logger.error(exception, "createValidationFilter was not successful");
      return null;
    }
  }

  return cachedValidationFilter;
}

// remove fields, which are not present in the schema
const filterExtraFields = (data, schema) => {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return data; // Do not modify primitive values or arrays
  }

  const filteredData = {};

  // Case 1: Schema with `oneOf`
  if (schema.oneOf && Array.isArray(schema.oneOf)) {
    // Try to find the matching subschema
    for (const subSchema of schema.oneOf) {
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(subSchema);
      if (validate(data)) {
        // Apply the matching subschema
        return filterExtraFields(data, subSchema);
      }
    }
    console.warn('No matching schema found in oneOf.');
    return {}; // If no schema matches, return an empty object
  }

  // Case 2: Schema with `properties`
  const properties = schema.properties || {};

  for (const key of Object.keys(data)) {
    if (properties[key]) {
      // Key is explicitly defined in `properties`
      const propertySchema = properties[key];
      if (propertySchema.type === 'object') {
        // Process nested objects
        filteredData[key] = filterExtraFields(data[key], propertySchema);
      } else if (propertySchema.type === 'array' && propertySchema.items) {
        // Process arrays recursively
        filteredData[key] = Array.isArray(data[key])
          ? data[key].map((item) => filterExtraFields(item, propertySchema.items))
          : data[key];
      } else {
        // Copy primitive values
        filteredData[key] = data[key];
      }
    }

    // Ignore fields that are not defined in properties
  }

  return filteredData;
}


// Filter Control Construct by API schema
exports.filterControlConstructBySchema = async function filterControlConstruct(data) {
  const validationFilter = await getValidationFilter();

//  fs.writeFileSync("data1.json", JSON.stringify(data, null, 2));

  const isValid = validationFilter(data);
  if (!isValid) {
    logger.error('Validation error:', validationFilter.errors);
    return null;
  }
//  fs.writeFileSync("data2.json", JSON.stringify(data, null, 2));

  const filteredData = filterExtraFields(data, validationFilter.schema);

//  fs.writeFileSync("data3.json", JSON.stringify(filteredData, null, 2));

  return filteredData;
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

    // Filtering is done in the MWDI by the fields filter.
    // // Filter Control Construct
    // if (ret.code === responseCodeEnum.code.OK) {
    //   ret.message = await this.filterControlConstructBySchema(ret.message);
    // }

    return ret;
  } finally {
    --numberOfParallelRequests;
  }
}
