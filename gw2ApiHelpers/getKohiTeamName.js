// getKohiTeamName.js

const fs = require('fs/promises');
const path = require('path');
const { getGuildTeamId } = require('./getGuildTeamId.js');

/**
 * Gets the English name of the team associated with the player's selected WvW guild.
 */
async function getKohiTeamName(apiKey) {
    try {
        // Step 1: Get the guild's team ID by calling our previously created function.
        const teamId = await getGuildTeamId(apiKey);

        // If no team ID was found (e.g., no guild selected), we can't continue.
        if (!teamId) {
            return null;
        }

        // Step 2: Read the wvwTeams.json file.
        const wvwTeamsPath = path.join(__dirname, 'wvwTeams.json');
        const wvwTeamsData = await fs.readFile(wvwTeamsPath, 'utf8');
        const wvwTeams = JSON.parse(wvwTeamsData);

        // Step 3: Look up the team name using the teamId.
        // The ?.en safely handles cases where the teamId might not be in our JSON file.
        const teamName = wvwTeams[teamId]?.en || 'Unknown';

        return teamName;

    } catch (error) {
        console.error('An error occurred while getting the KOHI WvW Team name:', error.message);
        throw error;
    }
}

module.exports = { getKohiTeamName };