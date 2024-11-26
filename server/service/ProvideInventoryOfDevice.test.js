const individualServicesService = require('./IndividualServicesService');
const requestHandler = require('./individualServices/RequestHandler');
const initConfig = require('../initConfig');

jest.mock('./individualServices/RequestHandler'); // Mocking des requestHandlers


function getMockResultData(data)
{
  return {
    code: 200,
    message: data,
    headers: {},
    operationName: 'operationName'
  };
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


describe('provideInventoryOfDevice', () => {
    const mockRequestUrl = 'http://localhost:4019/v1/provide-inventory-data-of-device';

    it('should call getDataFromMWDI with correct arguments and return the result', async () => {
        const mockResult = {
          "core-model-1-4:control-construct": [
            // {
            //   "profile-collection": {
            //     "profile": []
            //   }
            // }
          ]
        };

        const expectedResult = {
          "core-model-1-4:control-construct": []
        };

        const input = {"mount-name": "305251234"};

        // set the mock return value
        requestHandler.getDataFromMWDI.mockResolvedValue(getMockResultData(mockResult));

        // Execute the function
        await wait(1000);
        const result = await individualServicesService.provideInventoryOfDevice(mockRequestUrl, input);

        // Checks whether the function was called with the correct parameters
        expect(requestHandler.getDataFromMWDI).toHaveBeenCalledWith(
          mockRequestUrl,
          'RequestForProvidingInventoryDataOfDeviceCausesFilteredRequestToMwdi',
          {"mount-name": "305251234"},
          "equipment-augment-1-0:control-construct-pac;top-level-equipment;equipment(uuid;operational-state;connector(local-id;equipment-augment-1-0:connector-pac(connector-kind;outside-label;sequence-id));contained-holder(occupying-fru;local-id;equipment-augment-1-0:holder-pac(vendor-label;outside-label;sequence-id));expected-equipment(structure(category);manufactured-thing(manufacturer-properties(manufacturer-name);equipment-type(part-type-identifier;version));local-id;operational-state);actual-equipment(structure(category);physical-properties(temperature);manufactured-thing(manufacturer-properties(manufacturer-name);equipment-type(part-type-identifier;version);equipment-instance(manufacture-date;serial-number));operational-state));firmware-1-0:firmware-collection;logical-termination-point(uuid;layer-protocol(local-id;layer-protocol-name;air-interface-2-0:air-interface-pac(air-interface-configuration);ethernet-container-2-0:ethernet-container-pac(ethernet-container-configuration);hybrid-mw-structure-2-0:hybrid-mw-structure-pac(hybrid-mw-structure-configuration);ip-interface-1-0:ip-interface-pac(ip-interface-configuration);mac-interface-1-0:mac-interface-pac(mac-interface-configuration);pure-ethernet-structure-2-0:pure-ethernet-structure-pac(pure-ethernet-structure-configuration);tdm-container-2-0:tdm-container-pac(tdm-container-configuration);vlan-interface-1-0:vlan-interface-pac(vlan-interface-configuration);wire-interface-2-0:wire-interface-pac(wire-interface-configuration)));profile-collection;forwarding-domain"
        );

        // Checks whether the result is correct
        expect(result.code).toBe(200);
        expect(result.message).toStrictEqual(expectedResult);
    });

    it('should handle errors and throw an exception if getDataFromMWDI fails', async () => {
        const mockError = new Error('Request failed');

        // Mock an error case
        requestHandler.getDataFromMWDI.mockRejectedValue(mockError);

        // Checks whether the function throws the error correctly
        await wait(1000);
        await expect(individualServicesService.provideInventoryOfDevice(mockRequestUrl)).rejects.toThrow('Request failed');
    });
});


describe('provideInventoryOfDevice throttling', () => {
  const mockRequestUrl = 'http://localhost:4019/v1/provide-inventory-data-of-device';

  it('should call getDataFromMWDI with correct arguments and return the result', async () => {
    const mockResult = {
      "core-model-1-4:control-construct": [
        {
          "profile-collection": {
            "profile": []
          }
        }
      ]
    };

    const input = {"mount-name": "305251234"};

    // Set the Mock return value
    requestHandler.getDataFromMWDI.mockResolvedValue(getMockResultData(mockResult));

    // The first call must be successful.
    await wait(1000);
    let result = await individualServicesService.provideInventoryOfDevice(mockRequestUrl, input);
    expect(result.code).toBe(200);

    let errorReturns = 0;
    for(let i=0; i<10; ++i) {
      result = await individualServicesService.provideInventoryOfDevice(mockRequestUrl, input);

      if (result.code == 429) {
        ++errorReturns;
      }
    }

    // All ten calls in the following second interval shall be rejected.
    expect(errorReturns).toBe(10);
    // Only one call shall be accepted.
    expect(requestHandler.getDataFromMWDI).toHaveBeenCalledTimes(1);

    // After one second has elapsed, the next call must be successful again.

    await wait(1000);
    result = await individualServicesService.provideInventoryOfDevice(mockRequestUrl, input);
    expect(result.code).toBe(200);

    result = await individualServicesService.provideInventoryOfDevice(mockRequestUrl, input);
    expect(result.code).toBe(429);
  });
});
