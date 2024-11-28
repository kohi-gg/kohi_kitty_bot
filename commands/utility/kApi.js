const { SlashCommandBuilder } = require('discord.js');
const { validateApiKey } = require('../../helper/apiKeyValidation'); 
const { handleApiKeyError } = require('../../helper/apiKeyErrorHandler');
const { storeApiKey } = require('../../helper/apiKeyStorage');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kapi')
    .setDescription('Set your Guild Wars 2 Account API key.')
    .addStringOption(option =>
      option.setName('api-key')
        .setDescription('Your Guild Wars 2 Account API key.')
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const apiKey = interaction.options.getString('api-key');
    const discordUserId = interaction.user.id;

    if (apiKey.length !== 72) {
      return interaction.editReply({
        content: 'Invalid API key format. Please provide a valid 72-character API key. API keys may be created or deleted [here](<https://account.arena.net/applications>).'
      });
    }

    try {
      // Validate API key with required scopes
      await validateApiKey(apiKey); 

      const teamIdResponse = await axios.get('https://api.guildwars2.com/v2/account/wvw', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });

      const teamId = teamIdResponse.data.team;

      // Fetch account name for the success message
      const response = await axios.get('https://api.guildwars2.com/v2/account', {
        headers: { Authorization: `Bearer ${apiKey}` }
      });
      await interaction.editReply({ content: `API key set for ${response.data.name} successfully! 😺` });

      // Store the API key if validation succeeds
      await storeApiKey(discordUserId, apiKey, teamId, response.data.name);

    } catch (error) {
      console.error('Error validating API key:', error);
      handleApiKeyError(error, interaction);
    }
  },
};