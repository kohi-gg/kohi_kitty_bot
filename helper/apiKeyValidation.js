const axios = require('axios');

async function validateApiKey(apiKey) {
  // Check `wvw` scope
  try {
    await axios.get('https://api.guildwars2.com/v2/account/wvw', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new Error('Your API key does not have the required `wvw` scope. Create an [ArenaNet API Key](<https://account.arena.net/applications/create>) with `account`, `guilds`, and `wvw` scope checked.');
    }
  }

  // Check `account` scope
  try {
    await axios.get('https://api.guildwars2.com/v2/account', {
      headers: { Authorization: `Bearer ${apiKey}` }
    });
  } catch (error) {
    if (error.response && error.response.status === 403) {
      throw new Error('Your API key does not have the required `account` scope. Create an [ArenaNet API Key](<https://account.arena.net/applications/create>) with `account`, `guilds`, and `wvw` scope checked.');
    }
  }
}

module.exports = { validateApiKey };