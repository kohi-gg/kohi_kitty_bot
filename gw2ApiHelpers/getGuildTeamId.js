// getGuildTeamId.js

const axios = require('axios');
// Import the function from your existing file
const { getGuildId } = require('./getGuildId.js');

/**
 * Finds the WvW team ID for the player's selected guild.
 * It first determines the player's guild, then looks up that guild's team assignment.
 */
async function getGuildTeamId(apiKey) {
    try {
        // Step 1: Reuse your existing function to get the player's selected guild ID.
        const guildId = await getGuildId(apiKey);

        // If the player has not selected a guild for WvW, we can't proceed.
        if (!guildId) {
            console.log("No WvW guild selected by the player. Cannot find guild's team ID.");
            return null;
        }

        // Step 2: Fetch the list of all guilds and their assigned teams.
        // Note: The region 'na' can be changed to 'eu' if needed.
        const response = await axios.get(
            "https://api.guildwars2.com/v2/wvw/guilds/na",
            {
                headers: {
                    Authorization: `Bearer ${apiKey}`,
                },
            }
        );
        const guildTeamMappings = response.data;

        // Step 3: Look up the team ID using the guildId as the key.
        const teamId = guildTeamMappings[guildId];

        if (!teamId) {
            console.log(`Guild ${guildId} was not found in the current ArenaNet's WvW team assignments.`);
            return null;
        }

        // The API returns the team ID as a string.
        return teamId;

    } catch (error) {
        console.error('Error during the process of getting the guild team ID:', error.message);
        throw error;
    }
}

module.exports = { getGuildTeamId };