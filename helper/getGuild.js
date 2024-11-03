const axios = require('axios');

async function getGuild(apiKey) {
  try {
    const response = await axios.get('https://api.guildwars2.com/v2/account/wvw', {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });

    const accountInfo = response.data;
    const guildId = accountInfo.guild;
    return guildId;

  } catch (error) {
    console.error('Error fetching WvW team:', error);
    throw error;
  }
}

module.exports = { getGuild };