const individualServicesService = require('./IndividualServicesService');
const axios = require('axios');
const initConfig = require('../initConfig');

jest.mock('axios');
jest.mock('onf-core-model-ap/applicationPattern/services/ExecutionAndTraceService');


const mockRequestUrl = 'http://localhost:4019/v1/provide-list-of-connected-devices';

async function callProvideListOfConnectedDevices(axiosMockResponse) {
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
  return result;
}

describe('provideListOfConnectedDevices', () => {
    it('should call axios.post with correct arguments and return the result', async () => {
        const expectedResult = {
            "mount-name-list": [
                "305251234",
                "105258888"
            ]};

        const axiosMockResponse = {
            status: 200,
            data: expectedResult,
            headers: {}
        };

        const result = await callProvideListOfConnectedDevices(axiosMockResponse);

        // Checks whether the result is correct
        expect(result.code).toStrictEqual(200);
        expect(result.message).toEqual(expectedResult);
    });
});

async function checkTranslation(codeIn, codeExpected, msgExpected) {
  const axiosMockResponse = {
    status: codeIn,
    data: {},
    headers: {}
  };

  const result = await callProvideListOfConnectedDevices(axiosMockResponse);

  // Checks whether the result is correct
  expect(result.code).toStrictEqual(codeExpected);

  if (msgExpected) {
    expect(result.message).toStrictEqual(msgExpected);
  }
}

describe('checkErrorTranslation', () => {
  it('should call axios.post and return the translated result', async () => {
    await checkTranslation(401, 531, "Bad Gateway. Authentication at upstream server failed.");
    await checkTranslation(403, 531, "Bad Gateway. Authentication at upstream server failed.");
    await checkTranslation(404, 404); // Not Found
    await checkTranslation(408, 532, "Bad Gateway. Upstream server not responding.");
    await checkTranslation(500, 502, "Bad Gateway");
    await checkTranslation(555, 555); // unknown error code
  });
});
