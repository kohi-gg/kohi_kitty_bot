// getWvwTeamId.test.js

const axios = require('axios');
const { getWvwTeamId } = require('../gw2ApiHelpers/getWvwTeamId.js');
require('dotenv').config({ path: './.env' });

// Tell Jest to replace 'axios' with our mock version
jest.mock('axios');

describe('getWvwTeamId', () => {

    const fakeApiKey = process.env.API_KEY;

    // Before each test, clear the history of our mock functions
    beforeEach(() => {
        axios.get.mockClear();
    });

    test('should return the team ID when the API call is successful', async () => {
        // ARRANGE: Set up the mock response from the API
        const mockTeamId = 11007;
        axios.get.mockResolvedValue({
            data: {
                team: mockTeamId,
                guild: 'D68FDD21-DB39-EE11-8465-0228F2FB5E53'
            }
        });

        // ACT: Call the function we're testing
        const result = await getWvwTeamId(fakeApiKey);

        // ASSERT: Check that we received the correct value
        expect(result).toBe(mockTeamId);

        // Optional but good practice: Assert that axios was called correctly
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith(
            'https://api.guildwars2.com/v2/account/wvw',
            {
                headers: { Authorization: `Bearer ${fakeApiKey}` }
            }
        );
    });

    test('should throw an error if the API key is not provided', async () => {
        // ARRANGE: No arrangement needed, we'll call the function with a null key
        // ACT & ASSERT: Expect the function call to be rejected with a specific error message
        await expect(getWvwTeamId(null)).rejects.toThrow('API_KEY is not defined in your environment variables.');
    });

    test('should throw an error if the axios API call fails', async () => {
        // ARRANGE: Configure the mock to simulate a failure
        const errorMessage = 'Request failed with status code 500';
        axios.get.mockRejectedValue(new Error(errorMessage));

        // ACT & ASSERT: Expect the function call to be rejected with the same error
        await expect(getWvwTeamId(fakeApiKey)).rejects.toThrow(errorMessage);
    });
});