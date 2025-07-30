// storeGw2Info.test.js

// Mock all dependencies at the top
jest.mock('../helper/db.js');
jest.mock('../gw2ApiHelpers/getWvwTeamId.js');
jest.mock('axios');

const { storeGw2Info } = require('../gw2ApiHelpers/storeGw2Info.js');
const pool = require('../helper/db.js');
jest.spyOn(pool, 'query').mockImplementation(() => Promise.resolve());
const { getWvwTeamId } = require('../gw2ApiHelpers/getWvwTeamId.js');
const axios = require('axios');
require('dotenv').config({ path: '../.env' });

// This hook runs ONCE after all tests in this file are done.
afterAll(async () => {
    // This gracefully closes all connections in the pool.
    await pool.end();
});

describe('storeGw2Info', () => {

    const fakeDiscordId = process.env.DISCORD_USER_ID;
    const fakeApiKey = process.env.API_KEY;

    // Clear all mock history before each test runs
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should fetch data and store it successfully for a new user', async () => {
        // ARRANGE
        const mockTeamId = 11007;
        const mockAccountName = 'MyAccount.1234';

        // 1. Mock the dependencies' successful responses
        getWvwTeamId.mockResolvedValue(mockTeamId);
        axios.get.mockResolvedValue({ data: { name: mockAccountName } });
        // Mock the database query to simulate success
        pool.query.mockResolvedValue();

        // ACT
        const result = await storeGw2Info(fakeDiscordId, fakeApiKey);

        // ASSERT
        // 1. Check if the function returned the correct data
        expect(result).toEqual({
            discordUserId: fakeDiscordId,
            apiKey: fakeApiKey,
            team_id: mockTeamId,
            account_name: mockAccountName
        });

        // 2. Verify that our mocks were called with the correct arguments
        expect(getWvwTeamId).toHaveBeenCalledWith(fakeApiKey);
        expect(axios.get).toHaveBeenCalledWith(
            'https://api.guildwars2.com/v2/account',
            { headers: { Authorization: `Bearer ${fakeApiKey}` } }
        );
        expect(pool.query).toHaveBeenCalledTimes(1);
        // You could add a more specific check for the query text if desired
    });

    test('should throw an error if the GW2 API call fails', async () => {
        // ARRANGE: Mock one of the API calls to fail
        getWvwTeamId.mockRejectedValue(new Error('Invalid API Key'));

        // ACT & ASSERT
        await expect(storeGw2Info(fakeDiscordId, fakeApiKey)).rejects.toThrow('Invalid API Key');

        // Ensure no database operation was attempted if the API failed
        expect(pool.query).not.toHaveBeenCalled();
    });

    test('should throw an error if the database query fails', async () => {
        // ARRANGE: Mock API calls to succeed, but the database to fail
        getWvwTeamId.mockResolvedValue(11007);
        axios.get.mockResolvedValue({ data: { name: 'MyAccount.1234' } });
        pool.query.mockRejectedValue(new Error('DB connection error'));

        // ACT & ASSERT
        await expect(storeGw2Info(fakeDiscordId, fakeApiKey)).rejects.toThrow('DB connection error');
    });
});