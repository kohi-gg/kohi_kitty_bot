// getKohiTeamName.test.js

const { getKohiTeamName } = require('../gw2ApiHelpers/getKohiTeamName.js');

// Import the modules we need to mock
const { getGuildTeamId } = require('../gw2ApiHelpers/getGuildTeamId.js');
const fs = require('fs/promises');
require('dotenv').config({ path: '../.env' });

// Mock both dependencies
jest.mock('../gw2ApiHelpers/getGuildTeamId.js');
jest.mock('fs/promises');

describe('getKohiTeamName', () => {

    const fakeApiKey = process.env.API_KEY;
    const mockWvwTeams = {
        "11007": { "en": "Throne of Balthazar", "de": "Thron des Balthasar" },
        "11001": { "en": "Moogooloo", "de": "Muuguuluu" }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should return the correct team name for a valid guild team ID', async () => {
        // ARRANGE
        // 1. Mock getGuildTeamId to return a valid team ID string
        getGuildTeamId.mockResolvedValue('11007');
        // 2. Mock the file system to return our team data
        fs.readFile.mockResolvedValue(JSON.stringify(mockWvwTeams));

        // ACT
        const teamName = await getKohiTeamName(fakeApiKey);

        // ASSERT
        expect(teamName).toBe('Throne of Balthazar');
        expect(getGuildTeamId).toHaveBeenCalledWith(fakeApiKey);
        expect(fs.readFile).toHaveBeenCalledTimes(1);
    });

    test('should return null if getGuildTeamId returns null', async () => {
        // ARRANGE: Simulate the case where no guild or team ID was found initially
        getGuildTeamId.mockResolvedValue(null);

        // ACT
        const teamName = await getKohiTeamName(fakeApiKey);

        // ASSERT
        expect(teamName).toBeNull();
        // The file system should not be read if we don't have a teamId
        expect(fs.readFile).not.toHaveBeenCalled();
    });

    test('should return "Unknown" if the team ID is not in the JSON file', async () => {
        // ARRANGE
        getGuildTeamId.mockResolvedValue('99999'); // An ID that doesn't exist in our mock
        fs.readFile.mockResolvedValue(JSON.stringify(mockWvwTeams));

        // ACT
        const teamName = await getKohiTeamName(fakeApiKey);

        // ASSERT
        expect(teamName).toBe('Unknown');
    });

    test('should throw an error if fs.readFile fails', async () => {
        // ARRANGE
        getGuildTeamId.mockResolvedValue('11007');
        fs.readFile.mockRejectedValue(new Error('File not found'));

        // ACT & ASSERT
        await expect(getKohiTeamName(fakeApiKey)).rejects.toThrow('File not found');
    });
});