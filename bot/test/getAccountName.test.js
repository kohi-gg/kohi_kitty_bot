// getAccountName.test.js

jest.mock('axios'); // Mock the axios module
const axios = require('axios');
const { getAccountName } = require('../gw2ApiHelpers/getAccountName.js');
require('dotenv').config({ path: '../.env' });

describe('getAccountName', () => {

    const fakeApiKey = process.env.API_KEY;

    // Clear mock call history before each test
    beforeEach(() => {
        axios.get.mockClear();
    });

    test('should return the account name for a valid API key', async () => {
        // ARRANGE: Set up the mock successful response
        const mockAccountName = 'Test.1234';
        axios.get.mockResolvedValue({
            data: {
                id: 'account-guid',
                name: mockAccountName,
                age: 12345
            }
        });

        // ACT: Call the function
        const accountName = await getAccountName(fakeApiKey);

        // ASSERT: Check the results
        expect(accountName).toBe(mockAccountName);
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith(
            'https://api.guildwars2.com/v2/account',
            expect.objectContaining({
                headers: { Authorization: `Bearer ${fakeApiKey}` }
            })
        );
    });

    test('should throw an error if no API key is provided', async () => {
        // ARRANGE & ACT & ASSERT
        // Expect the function call with a null key to be rejected with an error.
        await expect(getAccountName(null)).rejects.toThrow('An API key must be provided.');
        // Ensure no API call was attempted.
        expect(axios.get).not.toHaveBeenCalled();
    });

    test('should throw an error if the API call fails', async () => {
        // ARRANGE: Mock axios to simulate a network failure
        const errorMessage = 'Request failed with status code 401';
        axios.get.mockRejectedValue(new Error(errorMessage));

        // ACT & ASSERT
        await expect(getAccountName(fakeApiKey)).rejects.toThrow(errorMessage);
    });
});