// updateWvwTeamId.js

const fs = require('fs/promises');
const path = require('path');
const pool = require('../helper/db.js');
const { getWvwTeamId } = require('./getWvwTeamId.js');

/**
 * Checks a user's current WvW team ID against the one stored in the database.
 * If it has changed, it updates the database record and logs the new team name.
 * @returns {Promise<string|null>} The English name of the WvW team or null if no team is found.
 * @param {string} discordUserId - The Discord user ID to check and update.
 */
async function updateWvwTeamId(discordUserId) {
    try {
        // Step 1: Get the stored API key and old team ID from our database using the discordUserId.
        const selectQuery = 'SELECT api_key, team_id FROM user_api_keys WHERE discord_user_id = $1';
        const dbResult = await pool.query(selectQuery, [discordUserId]);

        if (dbResult.rows.length === 0) {
            console.log(`No record found for Discord user ${discordUserId}.`);
            return null;
        }

        const { api_key: apiKey, team_id: oldTeamId } = dbResult.rows[0];


        const wvwTeamsPath = path.join(__dirname, 'wvwTeams.json');
        const wvwTeamsData = await fs.readFile(wvwTeamsPath, 'utf8');
        const wvwTeams = JSON.parse(wvwTeamsData);

        // Step 2: Get the current team ID from the GW2 API using the retrieved key.
        const newTeamId = await getWvwTeamId(apiKey);

        if (newTeamId == 0) {
            console.log(`User ${discordUserId} is not currently assigned to any WvW team.`);
            return "No WvW Team Assigned";
        }

        // Step 3: Compare the old and new team IDs.
        if (newTeamId == oldTeamId) {
            console.log(`Team ID (${newTeamId}) for Discord user ${discordUserId} has not changed.`);
            // If the team ID hasn't changed, we can return the current team name without updating the database.
            return wvwTeams[newTeamId]?.en || 'Unknown Name';
        }

        // Step 4: If changed, update the database.
        console.log(`Team ID for ${discordUserId} changed from ${oldTeamId} to ${newTeamId}. Updating database...`);
        // The WHERE clause now uses discord_user_id to ensure we update the correct row.
        const updateQuery = 'UPDATE user_api_keys SET team_id = $1 WHERE discord_user_id = $2';
        await pool.query(updateQuery, [newTeamId, discordUserId]);
        console.log(`Database updated for ${discordUserId} with new team ID: ${newTeamId}`);

        // Step 5: Log the new team name.
        console.log(`Update successful for ${discordUserId}! New team is: ${wvwTeams[newTeamId]?.en || 'Unknown Name'} (${newTeamId})`);
        return wvwTeams[newTeamId]?.en || 'Unknown Name';

    } catch (error) {
        console.error(`An error occurred during the team ID update process for ${discordUserId}:`, error.message);
        throw error;
    }
}

module.exports = { updateWvwTeamId };