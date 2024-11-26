const individualServicesService = require('./IndividualServicesService');
const axios = require('axios');
const initConfig = require('../initConfig');

jest.mock('axios');
jest.mock('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');


describe('provideListOfConnectedDevices', () => {
    const mockRequestUrl = 'http://localhost:4019/v1/provide-list-of-connected-devices';

    it('should call axios.post with correct arguments and return the result', async () => {
        const expectedResult = {
            "mount-name-list": [
                "305251234",
                "105258888"
            ]};

        const axiosMockResponse =
          {
              status: 200,
              data: expectedResult,
              headers: {}
          };

        // set the mock return value
        axios.post.mockResolvedValue(axiosMockResponse);

        // Execute the function
        const result = await individualServicesService.provideListOfConnectedDevices(mockRequestUrl);

        // Checks whether the function was called with the correct parameters
        expect(axios.post).toHaveBeenCalledWith(
          expect.stringMatching(/.*\/v1\/provide-list-of-connected-devices/),
          {},
          expect.any(Object)
        );

        // Checks whether the result is correct
        expect(result.message).toStrictEqual(expectedResult);
    });
});
