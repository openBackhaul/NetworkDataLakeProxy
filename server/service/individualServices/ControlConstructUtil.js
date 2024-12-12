const onfAttributes = require('onf-core-model-ap/applicationPattern/onfModel/constants/OnfAttributes');
const forwardingDomain = require('onf-core-model-ap/applicationPattern/onfModel/models/ForwardingDomain');
const logicalTerminationPoint = require("onf-core-model-ap/applicationPattern/onfModel/models/LogicalTerminationPoint");
const forwardingConstruct = require("onf-core-model-ap/applicationPattern/onfModel/models/ForwardingConstruct");
const fileOperation = require("onf-core-model-ap/applicationPattern/databaseDriver/JSONDriver");
const onfPaths = require("onf-core-model-ap/applicationPattern/onfModel/constants/OnfPaths");
const logger = require('../LoggingService.js').getLogger();
const FcPort = require("onf-core-model-ap/applicationPattern/onfModel/models/FcPort");
const controlConstruct = require("onf-core-model-ap/applicationPattern/onfModel/models/ControlConstruct");
const tcpClientInterface = require("onf-core-model-ap/applicationPattern/onfModel/models/layerProtocols/TcpClientInterface");
const profileCollection = require('onf-core-model-ap/applicationPattern/onfModel/models/ProfileCollection');
const profile = require('onf-core-model-ap/applicationPattern/onfModel/models/Profile');

/**
 * Deletes all fcPorts (for client LTPs) for application with httpClientUUID. Application LTP must be deleted after this
 * @param httpClientUUID
 * @return {Promise<boolean>}
 */
async function deleteAllFcPortsForApplication(httpClientUUID) {
    try {
        let fcPortPairsForApp = await getAllFcPortsForApplication(httpClientUUID);
        for (const fcPortsForAppElement of fcPortPairsForApp) {
            await forwardingConstruct.deleteFcPortAsync(fcPortsForAppElement.forwardingConstruct.uuid, fcPortsForAppElement.fcPort["local-id"]);
        }
    } catch (exception) {
        logger.error("cleaning of FcPorts failed for " + httpClientUUID);
        return false;
    }

    return true;
}

async function getAllFcPortsForApplication(httpClientUuid) {
    let resultFcPortPairings = [];

    //get all uuids of operations for this application
    let opLtpUUIDs = await logicalTerminationPoint.getClientLtpListAsync(httpClientUuid);

    for (const opLtpUUID of opLtpUUIDs) {
        let fcPortPairings = await getAllFcPortsForLtpClient(opLtpUUID);
        for (const fcPortPair of fcPortPairings) {
            //check if entry exists already
            let found = false;
            for (const existingFcPort of resultFcPortPairings) {
                if ((existingFcPort["logical-termination-point"] === fcPortPair.fcPort["logical-termination-point"]) &&
                    (existingFcPort["local-id"] === fcPortPair.fcPort["local-id"])) {
                    found = true;
                    break;
                }
            }
            if (found === false) {
                resultFcPortPairings.push(fcPortPair);
            }
        }
    }

    return resultFcPortPairings;
}

/**
 * returns all fc ports for ltp uuid as pairs FcPort/ForwardConstruct
 *
 * @param ltpUuid
 * @return {Promise<*[]>}
 */
async function getAllFcPortsForLtpClient(ltpUuid) {

    let resultFcPortsPairList = [];

    let fcPortPairList = await getAllFcPorts();

    for (const fcPortPair of fcPortPairList) {
        let fcPortLogicalTerminationPoint = fcPortPair.fcPort[onfAttributes.FC_PORT.LOGICAL_TERMINATION_POINT];
        //filter by input ltpUuid
        if (fcPortLogicalTerminationPoint === ltpUuid) {
            resultFcPortsPairList.push(fcPortPair);
        }
    }

    return resultFcPortsPairList;
}

/**
 * @return list of FcPort/ForwardConstruct Pairs
 */
async function getAllFcPorts() {
    let resultFcPortPairList = [];

    let forwardingConstructList = await forwardingDomain.getForwardingConstructListAsync();
    for (let forwardingConstruct of forwardingConstructList) {
        let fcPortList = forwardingConstruct[onfAttributes.FORWARDING_CONSTRUCT.FC_PORT];
        for (let fcPort of fcPortList) {
            resultFcPortPairList.push({fcPort, forwardingConstruct});
        }
    }

    return resultFcPortPairList;
}

/**
 *
 * @param logicalTerminationPointOperationName
 * @param applicationHttpClientUuid
 * @return list of operation LTPs for LTP-name and application
 */
async function getLogicalTerminationPointsAsync(logicalTerminationPointOperationName, applicationHttpClientUuid) {

    let logicalTerminationPointList = await fileOperation.readFromDatabaseAsync(
        onfPaths.LOGICAL_TERMINATION_POINT
    );

    let opLTPList = [];
    for (const ltp of logicalTerminationPointList) {
        //filter by application
        if (ltp[onfAttributes.LOGICAL_TERMINATION_POINT.SERVER_LTP].length > 0 &&
            ltp[onfAttributes.LOGICAL_TERMINATION_POINT.SERVER_LTP][0] === applicationHttpClientUuid) {

            //get operation name if existant
            let operationName = recursiveSearchForKey(ltp, onfAttributes.OPERATION_CLIENT.OPERATION_NAME);
            if (operationName === logicalTerminationPointOperationName) {
                opLTPList.push(ltp);
            }
        }
    }

    return opLTPList;
}

function recursiveSearchForKey(obj, targetKey) {
    for (let key in obj) {
        if (obj.hasOwnProperty(key)) {
            if (key === targetKey) {
                return obj[key];
            }

            if (typeof obj[key] === 'object') {
                // Recursively search through nested objects
                const result = recursiveSearchForKey(obj[key], targetKey);
                if (result !== undefined) {
                    return result; // Return the result if found in the recursion
                }
            }
        }
    }
}

async function getForwardingConstructOutputOperationData(forwardingName) {

    //get forwardConstruct output operation, get server ltp (http), get server ltp (tcp), get protocol, address and port
    let forwardingConstructInstance = await forwardingDomain.getForwardingConstructForTheForwardingNameAsync(
        forwardingName);

    let opData = null;
    for (const singleFcPort of forwardingConstructInstance['fc-port']) {
        if (FcPort.portDirectionEnum.OUTPUT === singleFcPort['port-direction']) {

            //get http, tcp and operationName of subscriber
            let operationLTP = await controlConstruct.getLogicalTerminationPointAsync(singleFcPort['logical-termination-point']);
            if (!operationLTP) {
                continue;
            }
            let httpUUID = operationLTP['server-ltp'][0];
            let httpLTP = await controlConstruct.getLogicalTerminationPointAsync(httpUUID);
            let tcpUUID = httpLTP['server-ltp'][0];
            let tcpLTP = await controlConstruct.getLogicalTerminationPointAsync(tcpUUID);

            let enumProtocol = tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-protocol'];
            let stringProtocol = tcpClientInterface.getProtocolFromProtocolEnum(enumProtocol)[0];

            let operationName = operationLTP['layer-protocol'][0]['operation-client-interface-1-0:operation-client-interface-pac']['operation-client-interface-configuration']['operation-name'];
            let port = tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-port'];

            let address = tcpLTP['layer-protocol'][0]['tcp-client-interface-1-0:tcp-client-interface-pac']['tcp-client-interface-configuration']['remote-address'];
            // let targetOperationUrl = buildDeviceSubscriberOperationPath(stringProtocol, address, port, operationName);
            let operationKey = operationLTP['layer-protocol'][0]['operation-client-interface-1-0:operation-client-interface-pac']['operation-client-interface-configuration']['operation-key'];
            // let operationUUID = operationLTP['uuid'];

            opData = {
                "protocol": stringProtocol,
                "address": address,
                "port": port,
                // "targetOperationURL": targetOperationUrl,
                // "operationKey": operationKey,
                // "operationUUID": operationUUID,
                // "name": httpLTP['layer-protocol'][0]['http-client-interface-1-0:http-client-interface-pac']['http-client-interface-configuration']['application-name'],
                // "release": httpLTP['layer-protocol'][0]['http-client-interface-1-0:http-client-interface-pac']['http-client-interface-configuration']['release-number'],
                "operationName": operationName,
                "operationKey": operationKey,
            }
            break;
        }
    }

    return opData;
}

function getHttpAndTcpUUIDForNewRelease() {
    return new Promise(async function (resolve, reject) {
        try {
            let uuidOfHttpAndTcpClient = {};
            let nrHttpLTP = await getFirstHttpLTPByApplicationName("NewRelease");
            let tcpClientUuid = (await logicalTerminationPoint.getServerLtpListAsync(nrHttpLTP.uuid))[0];
            let httpClientUuid = nrHttpLTP.uuid;
            uuidOfHttpAndTcpClient = {httpClientUuid, tcpClientUuid}
            resolve(uuidOfHttpAndTcpClient)
        } catch (error) {
            reject(error)
        }
    })
}

async function getFirstHttpLTPByApplicationName(applicationName) {

    let logicalTerminationPointList = await fileOperation.readFromDatabaseAsync(
        onfPaths.LOGICAL_TERMINATION_POINT
    );

    for (const ltp of logicalTerminationPointList) {
        //get by application-name if existant
        let ltpApplicationName = recursiveSearchForKey(ltp, onfAttributes.HTTP_CLIENT.APPLICATION_NAME);
        if (ltpApplicationName === applicationName) {
            return ltp;
        }
    }

    return null;
}

async function getProfileStringValueByName(searchedStringValueName) {
    try {
        const stringProfileInstanceList = await profileCollection.getProfileListForProfileNameAsync(
            profile.profileNameEnum.STRING_PROFILE
        );

        if (!stringProfileInstanceList || stringProfileInstanceList.length === 0) {
            logger.warn(`No profiles found for profile name: ${profile.profileNameEnum.STRING_PROFILE}`);
            return null;
        }

        for (const stringProfileInstance of stringProfileInstanceList) {
            const stringProfilePac = stringProfileInstance?.[onfAttributes.STRING_PROFILE.PAC];
            const stringProfileCapability = stringProfilePac?.[onfAttributes.STRING_PROFILE.CAPABILITY];
            const stringName = stringProfileCapability?.[onfAttributes.STRING_PROFILE.STRING_NAME];

            if (stringName === searchedStringValueName) {
                let stringProfileConfiguration = stringProfilePac[onfAttributes.STRING_PROFILE.CONFIGURATION];
                return stringProfileConfiguration?.[onfAttributes.STRING_PROFILE.STRING_VALUE];
            }
        }

        // Log info if the searched string is not found
        logger.info(`String value '${searchedStringValueName}' not found in any profile.`);
    } catch(error) {
        logger.error(error, `error during search for string profile in config with name '${searchedStringValueName}'`);
    }

    // Return null if no match is found or an error occurs
    return null;
}


module.exports = {
    deleteAllFcPortsForApplication,
    getLogicalTerminationPointsAsync,
    getForwardingConstructOutputOperationData,
    getHttpAndTcpUUIDForNewRelease,
    getProfileStringValueByName
}
