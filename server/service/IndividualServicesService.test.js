const individualServicesService = require('./IndividualServicesService');

// Checking the filter function for Control Constructs
test('filterControlConstruct', async () => {
    const cc = {
        "core-model-1-4:control-construct": [{
            "uuid": "723215222",
            "administrative-control": "core-model-1-4:ADMINISTRATIVE_CONTROL_QUIESCENT",
            "alarms-1-0:alarm-pac": {
                "alarm-capability": {
                    "alarm-inventory-list": [
                        {
                            "alarm-type-id": "alarms-ext-ericsson-mltn:ALARM_TYPE_ID_CRITICAL_EVENT",
                            "alarm-type-qualifier": "",
                            "will-clear": false,
                            "specific-problem": "Critical Event",
                            "alarm-category": "alarms-1-0:ALARM_CATEGORY_TYPE_COMMUNICATIONS_ALARM",
                            "probable-cause-string": "Not yet defined.",
                            "probable-cause": -1,
                            "description": "Not yet defined."
                        }
                    ]
                }
            },
            "forwarding-domain": [{
                "uuid": "ro-2-0-2-op-fd-000",
                "forwarding-construct": [{
                    "uuid": "ro-2-0-2-op-fc-bm-000",
                    "name": [{
                        "value-name": "ForwardingKind",
                        "value": "core-model-1-4:FORWARDING_KIND_TYPE_INVARIANT_PROCESS_SNIPPET"
                    }, {
                        "value-name": "ForwardingName",
                        "value": "PromptForRegisteringCausesRegistrationRequest"
                    }],
                    "fc-port": [{
                        "local-id": "000",
                        "port-direction": "core-model-1-4:PORT_DIRECTION_TYPE_MANAGEMENT",
                        "logical-termination-point": "ro-2-0-2-op-s-bm-000"
                    }, {
                        "local-id": "100",
                        "port-direction": "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
                        "logical-termination-point": "ro-2-0-2-op-s-bm-000"
                    }]
                }, {
                    "uuid": "ro-2-0-2-op-fc-bm-001",
                    "name": [{
                        "value-name": "ForwardingKind",
                        "value": "core-model-1-4:FORWARDING_KIND_TYPE_INVARIANT_PROCESS_SNIPPET"
                    }, {
                        "value-name": "ForwardingName",
                        "value": "PromptForEmbeddingCausesRequestForBequeathingData"
                    }],
                    "fc-port": [{
                        "local-id": "100",
                        "port-direction": "core-model-1-4:PORT_DIRECTION_TYPE_INPUT",
                        "logical-termination-point": "ro-2-0-2-op-s-bm-001"
                    }, {
                        "local-id": "200",
                        "port-direction": "core-model-1-4:PORT_DIRECTION_TYPE_OUTPUT",
                        "logical-termination-point": "ro-2-0-2-op-c-bm-ro-2-0-2-000"
                    }]
                }]
            }],
            "logical-termination-point": [{
                "uuid": "ro-2-0-2-op-s-bm-000",
                "ltp-direction": "core-model-1-4:TERMINATION_DIRECTION_SOURCE",
                "client-ltp": [],
                "server-ltp": ["ro-2-0-2-http-s-000"],
                "layer-protocol": [{
                    "local-id": "0",
                    "layer-protocol-name": "operation-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_OPERATION_LAYER",
                    "operation-server-interface-1-0:operation-server-interface-pac": {
                        "operation-server-interface-capability": {
                            "operation-name": "/v1/register-yourself"
                        },
                        "operation-server-interface-configuration": {
                            "life-cycle-state": "operation-server-interface-1-0:LIFE_CYCLE_STATE_TYPE_EXPERIMENTAL"
                        }
                    }
                }]
            }, {
                "uuid": "ro-2-0-2-http-s-000",
                "ltp-direction": "core-model-1-4:TERMINATION_DIRECTION_SOURCE",
                "client-ltp": ["ro-2-0-2-op-s-bm-000"],
                "server-ltp": [],
                "layer-protocol": [{
                    "local-id": "0",
                    "layer-protocol-name": "http-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_HTTP_LAYER",
                    "http-server-interface-1-0:http-server-interface-pac": {
                        "http-server-interface-capability": {
                            "application-name": "RegistryOffice",
                            "release-number": "2.0.1",
                            "data-update-period": "http-server-interface-1-0:DATA_UPDATE_PERIOD_TYPE_REAL_TIME"
                        }
                    }
                }]
            }],
            "name": [
                {
                    "value-name": "externalLabel",
                    "value": "723215222"
                }
            ]
        }]
    };

    const expectedCc = {
        "core-model-1-4:control-construct" : [ {
            "forwarding-domain" : [ { } ],
            "logical-termination-point" : [ {
                "uuid" : "ro-2-0-2-op-s-bm-000",
                "layer-protocol" : [ {
                    "local-id" : "0",
                    "layer-protocol-name" : "operation-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_OPERATION_LAYER"
                } ]
            }, {
                "uuid" : "ro-2-0-2-http-s-000",
                "layer-protocol" : [ {
                    "local-id" : "0",
                    "layer-protocol-name" : "http-server-interface-1-0:LAYER_PROTOCOL_NAME_TYPE_HTTP_LAYER"
                } ]
            } ]
        } ]
    };

    const filteredCc = await individualServicesService.filterControlConstructBySchema(cc);

    expect(filteredCc).toStrictEqual(expectedCc);
});
