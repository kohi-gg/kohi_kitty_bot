const { SlashCommandBuilder } = require('discord.js');
const pool = require('../../helper/db');
const { wvwTeam } = require('../../helper/wvwTeam');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getkakampi')
    .setDescription('Get your World vs World team information.'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const discordUserId = interaction.user.id;
    const guild = interaction.guild;

    try {
      const result = await pool.query('SELECT api_key FROM user_api_keys WHERE discord_user_id = $1', [discordUserId]);

      if (result.rows.length === 0) {
        return interaction.editReply({
          content: "You haven't set your API key yet. Please use `/kapi` to set it up first."
        });
      }

      const apiKey = result.rows[0].api_key;

      try {
        const teamName = await wvwTeam(apiKey);

        let roleName = `@${teamName}`;
        let teamRole = guild.roles.cache.find(role => role.name === roleName);

        if (!teamRole) {
          teamRole = await guild.roles.create({
            name: roleName,
            color: '#FFFF9F',
            reason: 'WvW team role',
          });
          console.log(`Created role: ${roleName}`);
        }

        await interaction.member.roles.add(teamRole);
        console.log(`Added role ${roleName} to user ${interaction.user.tag}`);

        await interaction.editReply({
          content: `Your WvW team is: **${teamName}**. The **${roleName}** role has been assigned to you.`
        });

      } catch (error) {
        console.error('Error fetching/assigning WvW team:', error);
        if (error.response && error.response.status === 401) {
          return interaction.editReply({
            content: 'Your API key is invalid or has expired. Please use `/kapi` to update it.'
          });
        }
        return interaction.editReply({
          content: 'An error occurred while fetching your WvW team. Please try again later.'
        });
      }

    } catch (dbError) {
      console.error('Error retrieving API key from database:', dbError);
      return interaction.editReply({
        content: 'An error occurred while accessing your API key. Please try again later.'
      });
    }
  },
};