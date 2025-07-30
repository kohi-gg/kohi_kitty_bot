// updateWvwTeamId.test.js

// Mock all dependencies
jest.mock('../gw2ApiHelpers/getWvwTeamId.js');
jest.mock('fs/promises');

// Spy on the real pool to control its 'query' and 'end' methods
const pool = require('../helper/db.js');
jest.spyOn(pool, 'query').mockImplementation(() => Promise.resolve({ rows: [], rowCount: 0 }));
jest.spyOn(pool, 'end').mockImplementation(() => Promise.resolve());

const { updateWvwTeamId } = require('../gw2ApiHelpers/updateWvwTeamId.js');
const { getWvwTeamId } = require('../gw2ApiHelpers/getWvwTeamId.js');
const fs = require('fs/promises');
require('dotenv').config({ path: '../.env' });

// Hook to close the DB pool after all tests in this file are done
afterAll(async () => {
    await pool.end();
});

describe('updateWvwTeamId', () => {

    const fakeDiscordId = process.env.DISCORD_USER_ID;
    const fakeApiKey = process.env.API_KEY;
    const mockWvwTeamsJson = JSON.stringify({
        "11001": { "en": "Moogooloo" },
        "11007": { "en": "Throne of Balthazar" }
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should update DB and log new team name if team ID has changed', async () => {
        // ARRANGE
        const oldTeamId = '11001';
        const newTeamId = 11007;

        // 1. Mock the initial DB SELECT to find the user and their old data
        pool.query.mockResolvedValueOnce({ rows: [{ api_key: fakeApiKey, team_id: oldTeamId }] });
        // 2. Mock the GW2 API call to return a new team ID
        getWvwTeamId.mockResolvedValue(newTeamId);
        // 3. Mock the file system
        fs.readFile.mockResolvedValue(mockWvwTeamsJson);
        // 4. Spy on console.log
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        // ACT
        await updateWvwTeamId(fakeDiscordId);

        // ASSERT
        // Check that the GW2 API was called with the key from the database
        expect(getWvwTeamId).toHaveBeenCalledWith(fakeApiKey);
        // Check that the UPDATE query was called with the new teamId and the correct discordId
        expect(pool.query).toHaveBeenCalledWith(
            'UPDATE user_api_keys SET team_id = $1 WHERE discord_user_id = $2',
            [newTeamId, fakeDiscordId]
        );
        // Check that the final success message was logged
        expect(consoleSpy).toHaveBeenCalledWith(`Update successful for ${fakeDiscordId}! New team is: Throne of Balthazar (11007)`);

        consoleSpy.mockRestore();
    });

    test('should do nothing if team ID has not changed', async () => {
        // ARRANGE
        const currentTeamId = 11007;
        pool.query.mockResolvedValueOnce({ rows: [{ api_key: fakeApiKey, team_id: '11007' }] });
        getWvwTeamId.mockResolvedValue(currentTeamId);
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        // ACT
        await updateWvwTeamId(fakeDiscordId);

        // ASSERT
        // Ensure that only the SELECT query was called (pool.query was called once)
        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(getWvwTeamId).toHaveBeenCalledTimes(1);
        expect(consoleSpy).toHaveBeenCalledWith(`Team ID (11007) for Discord user ${fakeDiscordId} has not changed.`);

        consoleSpy.mockRestore();
    });

    test('should do nothing if user is not found in database', async () => {
        // ARRANGE
        // Mock the initial DB SELECT to return no results
        pool.query.mockResolvedValueOnce({ rows: [] });
        const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => { });

        // ACT
        await updateWvwTeamId(fakeDiscordId);

        // ASSERT
        // No other functions should be called if the user isn't found
        expect(getWvwTeamId).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalledWith(`No record found for Discord user ${fakeDiscordId}.`);
    });
});