const { SlashCommandBuilder } = require('discord.js');
const pool = require('../../helper/db');
const { getGuildId } = require('../../gw2ApiHelpers/getGuildId');
const { updateWvwTeamId } = require('../../gw2ApiHelpers/updateWvwTeamId');
const { updateWvwTeamRole } = require('../../gw2ApiHelpers/updateWvwTeamRole');


module.exports = {
    data: new SlashCommandBuilder()
        .setName('whats-my-team')
        .setDescription('Get your World vs World team information.'),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });

        const discordUserId = interaction.user.id;

        try {
            const result = await pool.query('SELECT api_key FROM user_api_keys WHERE discord_user_id = $1', [discordUserId]);

            if (result.rows.length === 0) {
                return interaction.editReply({
                    content: "You haven't set your API key yet. Please use `/set-api` to set it up first."
                });
            }

            const apiKey = result.rows[0].api_key;
            const guildId = await getGuildId(apiKey);

            if (!guildId) {
                return interaction.editReply({
                    content: "You are not in a WvW guild or the API key is invalid."
                });
            }

            // Assuming wvwTeam is a function that takes a guild ID and returns the team name
            const teamName = await updateWvwTeamId(discordUserId);

            await updateWvwTeamRole(interaction.client, discordUserId);

            return interaction.editReply({
                content: `Your WvW team is: ${teamName}. \nIf you want to update your team information, use the command again.`

            });

        } catch (error) {
            console.error('Error fetching WvW team:', error);
            if (error.message.includes('503')) {
                return interaction.editReply({
                    content: 'The Guild Wars 2 API is currently unavailable. Please try again later.'
                });
            }
            return interaction.editReply({
                content: 'An error occurred while fetching your WvW team information.'
            });
        }
    },
};