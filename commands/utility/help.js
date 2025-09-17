const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kohi-help')
    .setDescription('Provides information on how to use the Kohi Bot commands.'),
  async execute(interaction) {
    const helpEmbed = {
      color: 0x0099ff,
      title: 'Kohi Bot Help',
      description: 'Command list',
      fields: [
        {
          name: '1. Set your API key using `/set-api`',
          value: `
          Go to: <https://account.arena.net/applications/create>\nYou may use an old API key or create a new API key as long as the following scopes checked.\n\n
            ✅ **account**\n  ✅ **guilds**\n  ✅ **wvw**\n\nUse the command \`/set-api <your-api-key>\` to provide the bot with your API key. \n**Important:** Keep your API key safe and do not share it with anyone.
          \n
          `,
        },
        {
          name: '2. Look for your WvW team using `/whats-my-team`',
          value: `
            After successfully setting your API key, use the command \`/whats-my-team\`.\nThe bot will fetch your WvW team information and assign you the corresponding role.
            \n
          `,
        },
        {
          name: '3. Need Help?',
          value: 'If you encounter any errors, issues, or have concerns, feel free to ping <@&1158659592767668286>.',
        },
        {
          name: '/create-event',
          value: 'create a group content in GW2',
        },
      ],
      timestamp: new Date(),
      footer: {
        text: "Kohi's digital twin",
      },
    };

    await interaction.reply({ embeds: [helpEmbed] });
  },
};