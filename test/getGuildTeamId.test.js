// getGuildTeamId.test.js

const { getGuildTeamId } = require('../gw2ApiHelpers/getGuildTeamId.js');
const axios = require('axios');
// Import the getGuildId function so we can mock its behavior
const { getGuildId } = require('../gw2ApiHelpers/getGuildId.js');
require('dotenv').config({ path: './.env' });
const fakeApiKey = process.env.API_KEY;

// Mock the entire modules for axios and our local getGuildId.js file
jest.mock('axios');
jest.mock('../gw2ApiHelpers/getGuildId.js');

describe('getGuildTeamId', () => {

    // A fake API key to be used in our tests


    // Before each test, clear any previous mock history
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return the correct team ID when a guild is found', async () => {
        // ARRANGE: Set up the conditions for the test
        const mockPlayerGuildId = 'D68FDD21-DB39-EE11-8465-0228F2FB5E53';
        const expectedTeamId = '11007';

        // 1. Mock the getGuildId function to resolve with a guild ID
        //    It should be called with our fake API key.
        getGuildId.mockResolvedValue(mockPlayerGuildId);

        // 2. Mock the axios.get call to the PUBLIC guilds list
        axios.get.mockResolvedValue({
            data: {
                "SOME-OTHER-GUILD-ID": "11005",
                [mockPlayerGuildId]: expectedTeamId // Use the guild ID as a key in the mock response
            }
        });

        // ACT: Run the function we are testing
        const teamId = await getGuildTeamId(fakeApiKey);

        // ASSERT: Check if the results are what we expect
        expect(teamId).toBe(expectedTeamId);

        // Also assert that our mocks were called correctly
        expect(getGuildId).toHaveBeenCalledTimes(1);
        expect(getGuildId).toHaveBeenCalledWith(fakeApiKey); // Verify it was called with the API key
        expect(axios.get).toHaveBeenCalledTimes(1);
        expect(axios.get).toHaveBeenCalledWith("https://api.guildwars2.com/v2/wvw/guilds/na", expect.objectContaining({
            headers: {
                Authorization: `Bearer ${fakeApiKey}`,
            }
        })); // Verify it was called with the correct URL and headers
    });

    test('should return null if getGuildId returns null', async () => {
        // ARRANGE: Mock getGuildId to return null (player has no guild selected)
        getGuildId.mockResolvedValue(null);

        // ACT
        const teamId = await getGuildTeamId(fakeApiKey);

        // ASSERT
        expect(teamId).toBeNull();
        // The second API call to axios should never happen if no guildId is found
        expect(axios.get).not.toHaveBeenCalled();
    });

    test('should return null if the guild is not found in the team mappings', async () => {
        // ARRANGE
        // 1. Mock getGuildId to return a guild that we know won't be in the list
        getGuildId.mockResolvedValue('GUILD-ID-NOT-IN-THE-LIST');
        // 2. Mock the axios response with some other data
        axios.get.mockResolvedValue({
            data: { "SOME-OTHER-GUILD-ID": "11005" }
        });

        // ACT
        const teamId = await getGuildTeamId(fakeApiKey);

        // ASSERT
        expect(teamId).toBeNull();
    });

    test('should throw an error if the initial getGuildId call fails', async () => {
        // ARRANGE: Mock the first call to fail
        getGuildId.mockRejectedValue(new Error('Failed to authenticate with API key'));

        // ACT & ASSERT
        await expect(getGuildTeamId(fakeApiKey)).rejects.toThrow('Failed to authenticate with API key');
    });
});