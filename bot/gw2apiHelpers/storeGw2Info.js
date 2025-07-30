// storeGw2Info.js

const axios = require('axios');
const pool = require('../helper/db.js');
const { getWvwTeamId } = require('./getWvwTeamId.js');

/**
 * Fetches GW2 account info (team_id, account_name) using an API key and stores it
 * in the database along with the user's Discord ID. Updates existing records.
 */
async function storeGw2Info(discordUserId, apiKey) {
    if (!discordUserId || !apiKey) {
        throw new Error('Discord User ID and API Key must be provided.');
    }

    try {
        // Step 1 & 2: Fetch the team_id and account_name in parallel for efficiency.
        const [team_id, accountResponse] = await Promise.all([
            getWvwTeamId(apiKey),
            axios.get('https://api.guildwars2.com/v2/account', {
                headers: { Authorization: `Bearer ${apiKey}` },
            }),
        ]);

        const account_name = accountResponse.data.name;

        if (!team_id || !account_name) {
            throw new Error('Could not retrieve valid team_id or account_name from the GW2 API.');
        }

        // Step 3: Store everything in the database.
        // The ON CONFLICT clause handles the "upsert" logic:
        // If the discord_user_id exists, it updates the row; otherwise, it inserts a new one.
        const query = `
      INSERT INTO user_api_keys (discord_user_id, api_key, team_id, account_name)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (discord_user_id)
      DO UPDATE SET
        api_key = EXCLUDED.api_key,
        team_id = EXCLUDED.team_id,
        account_name = EXCLUDED.account_name;
    `;

        await pool.query(query, [discordUserId, apiKey, team_id, account_name]);

        const storedData = { discordUserId, apiKey, team_id, account_name };
        console.log('Successfully stored GW2 info for user:', storedData.account_name);

        return storedData;

    } catch (error) {
        console.error(`Failed to store GW2 info for user ${discordUserId}:`, error.message);
        throw error; // Re-throw the error so the calling function knows something went wrong.
    }
}

module.exports = { storeGw2Info };