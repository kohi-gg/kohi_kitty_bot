const { SlashCommandBuilder } = require('discord.js');
const axios = require('axios');
const { storeApiKey } = require('../../helper/apiKeyStorage');

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
        content: 'Invalid API key format. Please provide a valid 72-character API key. API keys may be created or deleted at `https://account.arena.net/applications`.'
      });
    }

    try {
      // Test the API key
      response = await axios.get('https://api.guildwars2.com/v2/account', {
        headers: {
          Authorization: `Bearer ${apiKey}`
        }
      });
      
      await storeApiKey(discordUserId, apiKey);

      await interaction.editReply({ content: `API key set for ${response.data.name} successfully! 😺` });

    } catch (error) {
      console.error('Error validating API key:', error);
      if (error.response && error.response.status === 401) {
        return interaction.editReply({
          content: 'Invalid API key. Please check your key and try again.'
        });
      }
      return interaction.editReply({
        content: 'An error occurred while setting your API key. Please try again later.'
      });
    }
  },
};