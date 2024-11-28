const pool = require('./db');

async function storeApiKey(discordUserId, apiKey, team_id, account_name) {
  try {
    await pool.query(
      'INSERT INTO user_api_keys (discord_user_id, api_key, team_id) VALUES ($1, $2, $3, $4) ON CONFLICT (discord_user_id) DO UPDATE SET api_key = EXCLUDED.api_key',
      [discordUserId, apiKey, team_id, account_name]
    );
    console.log(`API key stored for user ${discordUserId}`);
  } catch (error) {
    console.error('Error storing API key in database:', error);
    throw error;
  }
}

module.exports = { storeApiKey };