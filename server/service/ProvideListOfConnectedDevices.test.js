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


describe('provideListOfConnectedDevices', () => {
    const mockRequestUrl = 'http://localhost:4019/v1/provide-list-of-connected-devices';

    it('should call postRequestDataFromMWDI with correct arguments and return the result', async () => {
        const expectedResult = {
            "mount-name-list": [
                "305251234",
                "105258888"
            ]};

        // set the mock return value
        requestHandler.postRequestDataFromMWDI.mockResolvedValue(getMockResultData(expectedResult));

        // Execute the function
        const result = await individualServicesService.provideListOfConnectedDevices(mockRequestUrl);

        // Checks whether the function was called with the correct parameters
        expect(requestHandler.postRequestDataFromMWDI).toHaveBeenCalledWith(
          mockRequestUrl,
          'PromptForProvidingListOfConnectedDeviceCausesReadingMwdiDeviceList',
          {}
        );

        // Checks whether the result is correct
        expect(result.message).toStrictEqual(expectedResult);
    });

    it('should handle errors and throw an exception if postRequestDataFromMWDI fails', async () => {
        const mockError = new Error('Request failed');

        // Mock an error case
        requestHandler.postRequestDataFromMWDI.mockRejectedValue(mockError);

        // Checks whether the function throws the error correctly
        await expect(individualServicesService.provideListOfConnectedDevices(mockRequestUrl)).rejects.toThrow('Request failed');
    });
});
