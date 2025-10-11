const { SlashCommandBuilder } = require('discord.js');
const { validateApi } = require('../../gw2ApiHelpers/validateApi');
const { storeGw2Info } = require('../../gw2ApiHelpers/storeGw2Info');
const { getWvwTeamId } = require('../../gw2ApiHelpers/getWvwTeamId');
const { getAccountName } = require('../../gw2ApiHelpers/getAccountName');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set-api')
        .setDescription('Set your Guild Wars 2 Account API key.')
        .addStringOption(option =>
            option.setName('api-key')
                .setDescription('Your Guild Wars 2 Account API key.')
                .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const apiKey = interaction.options.getString('api-key');
        const discordUserId = interaction.user.id;

        // Validate the API key length
        if (apiKey.length !== 72) {
            return interaction.editReply({
                content: 'Invalid API key format. Please provide a valid 72-character API key. API keys may be created or deleted [here](<https://account.arena.net/applications>).'
            });
        }

        try {
            // Validate API key with required scopes
            await validateApi(apiKey);

            // If validation passes, fetch the WvW team ID
            const teamId = await getWvwTeamId(apiKey);

            // Fetch account name for the success message
            const accountName = await getAccountName(apiKey);
            await interaction.editReply({ content: `API key set for ${accountName} successfully! 😺` });

            // Store the API key if validation succeeds
            await storeGw2Info(discordUserId, apiKey, teamId, accountName);

        } catch (error) {
            console.error('Error validating API key:', error.message);
            if (error.message.includes('503')) {
                await interaction.editReply({ content: 'Guild Wars 2 API is currently unavailable (503). Please try again later.', ephemeral: true });
            } else {
                await interaction.editReply({ content: error.message, ephemeral: true });
            }
        }
    },
};