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
          name: '1. Set your API key using `/kapi`',
          value: `
            Go to: <https://account.arena.net/applications/create>
            You may use an old API key or create a new API key as long as the following scopes checked:
                ✅ **account**
                ✅ **guilds**
                ✅ **wvw**
            Use the command \`/kapi <your-api-key>\` to provide the bot with your API key. 
            **Important:** Keep your API key safe and do not share it with anyone.
          `,
        },
        {
          name: '2. Get your WvW role using `/getkakampi`',
          value: `
            After successfully setting your API key, use the command \`/getkakampi\`.
            The bot will fetch your WvW team information and assign you the corresponding role.
          `,
        },
        {
          name: '3. Need Help?',
          value: 'If you encounter any errors, issues, or have concerns, feel free to ping <@&1158659592767668286>.',
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