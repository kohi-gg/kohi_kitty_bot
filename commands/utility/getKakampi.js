const { SlashCommandBuilder } = require('discord.js');
const pool = require('../../helper/db');
const { wvwTeam } = require('../../helper/wvwTeam');
const { getGuild} = require('../../helper/getGuild');

// hardcoded team names.
const teamNames = [
  "Moogooloo",
  "Rall's Rest",
  "Domain of Torment",
  "Yohlon Haven",
  "Tombs of Drascir",
  "Hall of Judgment",
  "Throne of Balthazar",
  "Dwayna's Temple",
  "Abaddon's Prison",
  "Cathedral of Blood",
  "Lutgardis Conservatory",
  "Mosswood",
  "Skrittsburgh",
  "Fortune's Vale",
  "Silent Woods",
  "Ettin's Back",
  "Domain of Anguish",
  "Palawadan",
  "Bloodstone Gulch",
  "Frost Citadel",
  "Dragrimmar",
  "Grenth's Door",
  "Mirror of Lyssa",
  "Melandru's Dome",
  "Kormir's Library",
  "Great House Aviary",
  "Bava Nisos",
];

const kohiGuildId = "D68FDD21-DB39-EE11-8465-0228F2FB5E53";

module.exports = {
  data: new SlashCommandBuilder()
    .setName('getkakampi')
    .setDescription('Get your World vs World team information.'),
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const discordUserId = interaction.user.id;
    const guild = interaction.guild;
    const member = interaction.member;

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
        const guildId = await getGuild(apiKey)
        const roleName = `@${teamName}`;

        // Checking if you already set KOHI as your WvW Guild
        if (guildId !== kohiGuildId) {
          return interaction.editReply({
            content: "You haven't set KOHI as your WvW Guild. Please set it first."
          });
        }

        // Find the role for the user's current team
        const currentTeamRole = member.roles.cache.find(role => teamNames.includes(role.name.replace('@', '')));

        // Find or create the new team role
        let teamRole = guild.roles.cache.find(role => role.name === roleName);
        if (!teamRole) {
          teamRole = await guild.roles.create({
            name: roleName,
            color: '#FFFF9F',
            reason: 'WvW team role',
          });
          console.log(`Created role: ${roleName}`);
        }

        // Add the new role
        await member.roles.add(teamRole);
        console.log(`Added role ${roleName} to user ${interaction.user.tag}`);

        // Remove the old role if it exists and is different from the new one
        if (currentTeamRole && currentTeamRole.name !== roleName) { 
          await member.roles.remove(currentTeamRole);
          console.log(`Removed role ${currentTeamRole.name} from user ${interaction.user.tag}`);
        }

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