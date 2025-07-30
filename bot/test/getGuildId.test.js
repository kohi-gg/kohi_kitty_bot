// getGuildId.test.js

const axios = require('axios');
const { getGuildId } = require('../gw2ApiHelpers/getGuildId.js');
require('dotenv').config({ path: './.env' });

// This tells Jest to automatically replace 'axios' with a mock version.
jest.mock('axios');

describe('getGuildId', () => {

    // A fake API key to use for all our tests
    const fakeApiKey = process.env.API_KEY;

    // This hook runs before each test, clearing any previous mock data
    beforeEach(() => {
        axios.get.mockClear();
    });

    test('should return the guild ID when the API call is successful', async () => {
        // ARRANGE: Set up the conditions for this specific test
        const mockGuildId = 'D68FDD21-DB39-EE11-8465-0228F2FB5E53';
        // We configure our mock axios to return a successful response
        axios.get.mockResolvedValue({
            data: {
                guild: mockGuildId,
                team: 11007
            }
        });

        // ACT: Call the function we are testing
        const result = await getGuildId(fakeApiKey);

        // ASSERT: Check if the result is what we expect
        expect(result).toBe(mockGuildId);

        // We can also assert that axios was called correctly
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith(
            'https://api.guildwars2.com/v2/account/wvw',
            {
                headers: { Authorization: `Bearer ${fakeApiKey}` }
            }
        );
    });

    test('should return null when the account has no guild selected', async () => {
        // ARRANGE: Mock the API response to have a null guild
        axios.get.mockResolvedValue({
            data: {
                guild: null,
                team: 11007
            }
        });

        // ACT
        const result = await getGuildId(fakeApiKey);

        // ASSERT
        expect(result).toBeNull();
    });

    test('should throw an error if the API key is not provided', async () => {
        // ARRANGE: We will call the function with a falsy value (null)
        // ACT & ASSERT: We expect the function call to be rejected with an error
        await expect(getGuildId(null)).rejects.toThrow('API_KEY is not defined in your environment variables.');
    });

    test('should throw an error if the axios API call fails', async () => {
        // ARRANGE: Mock axios to simulate a network error
        const errorMessage = 'Network Error';
        axios.get.mockRejectedValue(new Error(errorMessage));

        // ACT & ASSERT
        await expect(getGuildId(fakeApiKey)).rejects.toThrow(errorMessage);
    });
});