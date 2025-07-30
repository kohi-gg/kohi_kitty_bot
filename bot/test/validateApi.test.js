// validateApi.test.js

jest.mock('axios');
const axios = require('axios');
const { validateApi } = require('../gw2ApiHelpers/validateApi.js');

describe('validateApi', () => {

    // A key with the correct length for valid API calls
    const validApiKey = 'A'.repeat(72);

    beforeEach(() => {
        // Clear mock history before each test
        axios.get.mockClear();
    });

    test('should return true for a valid API key with all scopes', async () => {
        // ARRANGE: Mock axios to resolve successfully for both calls
        axios.get.mockResolvedValue({ data: { success: true } });

        // ACT
        const isValid = await validateApi(validApiKey);

        // ASSERT
        expect(isValid).toBe(true);
        expect(axios.get).toHaveBeenCalledTimes(2); // Ensure both endpoints were checked
    });

    test('should throw an error for an API key with incorrect length', async () => {
        // ARRANGE
        const shortApiKey = 'invalid-length-key';

        // ACT & ASSERT
        await expect(validateApi(shortApiKey)).rejects.toThrow('Invalid API key format. It must be a 72-character string.');
        // Ensure no API calls were made for an obviously invalid key
        expect(axios.get).not.toHaveBeenCalled();
    });

    test('should throw an error for a completely invalid key (401 Unauthorized)', async () => {
        // ARRANGE: Mock axios to reject with a 401 error
        axios.get.mockRejectedValue({ response: { status: 401 } });

        // ACT & ASSERT
        await expect(validateApi(validApiKey)).rejects.toThrow('This API key is invalid. Please check the key and try again.');
    });

    test('should throw an error for a key missing scopes (403 Forbidden)', async () => {
        // ARRANGE: Mock axios to reject with a 403 error
        axios.get.mockRejectedValue({ response: { status: 403 } });

        // ACT & ASSERT
        await expect(validateApi(validApiKey)).rejects.toThrow(/Your API key is missing required permissions/);
    });

    test('should throw a generic error for other API issues (e.g., 500)', async () => {
        // ARRANGE: Mock axios to reject with a 500 server error
        axios.get.mockRejectedValue({ response: { status: 500 } });

        // ACT & ASSERT
        await expect(validateApi(validApiKey)).rejects.toThrow('The Guild Wars 2 API returned an error (Status 500). Please try again later.');
    });
});