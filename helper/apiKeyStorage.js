const pool = require('./db');

async function storeApiKey(discordUserId, apiKey) {
  try {
    await pool.query(
      'INSERT INTO user_api_keys (discord_user_id, api_key) VALUES ($1, $2) ON CONFLICT (discord_user_id) DO UPDATE SET api_key = EXCLUDED.api_key',
      [discordUserId, apiKey]
    );
    console.log(`API key stored for user ${discordUserId}`);
  } catch (error) {
    console.error('Error storing API key in database:', error);
    throw error;
  }
}

module.exports = { storeApiKey };