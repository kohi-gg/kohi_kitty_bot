const { 
  SlashCommandBuilder, 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle 
} = require('discord.js');
const axios = require('axios');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('heroku-logs')
    .setDescription('Fetches the latest Heroku logs for the Kohi Bot.')
    .addIntegerOption(option =>
      option.setName('lines')
        .setDescription('Number of log lines to fetch (Default: 50, Max: 100)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // --- SECURITY CHECK: Ensure the users are the authorized ones ---
    const authorizedUsersString = process.env.BOT_OWNER_IDS;
    if (!authorizedUsersString) {
      console.error("CRITICAL: BOT_OWNER_IDS environment variable is not set.");
      return interaction.reply({
        content: 'This command is not configured properly. Please contact serjeph.',
        ephemeral: true,
      });
    }

    const authorizedUsers = authorizedUsersString.split(',');
    if (!authorizedUsers.includes(interaction.user.id)) {
      return interaction.reply({
        content: 'You do not have permission to use this command. Go ask my master Sinaya!',
        ephemeral: true,
      });
    }

    // Defer the reply
    await interaction.deferReply({ ephemeral: true });

    try {
      const { HEROKU_API_KEY, HEROKU_APP_NAME } = process.env;

      if (!HEROKU_API_KEY || !HEROKU_APP_NAME) {
        console.error("Heroku environment variables are missing.");
        return interaction.editReply({
          content: 'Error: The bot is not configured correctly on the server. Missing env variables.'
        });
      }

      const lines = interaction.options.getInteger('lines') ?? 50;

      // 1. Create Heroku log session
      const logSessionResponse = await axios.post(
        `https://api.heroku.com/apps/${HEROKU_APP_NAME}/log-sessions`,
        { lines: lines, tail: false },
        {
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.heroku+json; version=3',
            'Authorization': `Bearer ${HEROKU_API_KEY}`,
          },
        }
      );

      const logURL = logSessionResponse.data.logplex_url;

      // 2. fetch logs from logplex URL
      const logsResponse = await axios.get(logURL);
      let logs = logsResponse.data;

      // 3. Handle empty logs
      if (!logs || logs.trim().length === 0) {
        return interaction.editReply({ content: 'No logs returned from Heroku.' });
      }

      // --- PAGINATION LOGIC ---
      const chunkSize = 1900; 
      const logChunks = [];
      for (let i = 0; i < logs.length; i += chunkSize) {
        logChunks.push(logs.slice(i, i + chunkSize));
      }

      let page = 0;

      const makeEmbed = (p) => new EmbedBuilder()
        .setColor('#6567a5')
        .setTitle(`📋 Logs for ${HEROKU_APP_NAME} — Page ${p + 1}/${logChunks.length}`)
        .setDescription("```" + logChunks[p] + "```")
        .setTimestamp();

      const makeButtons = (p) => 
        new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('prev')
            .setLabel('⬅️ Prev')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(p === 0),
          new ButtonBuilder()
            .setCustomId('next')
            .setLabel('Next ➡️')
            .setStyle(ButtonStyle.Primary)
            .setDisabled(p === logChunks.length - 1)
        );

      await interaction.editReply({
        embeds: [makeEmbed(page)],
        components: logChunks.length > 1 ? [makeButtons(page)] : []
      });

      const msg = await interaction.fetchReply();

      const filter = (i) =>
        i.user.id === interaction.user.id &&
        ['prev', 'next'].includes(i.customId);

      const collector = msg.createMessageComponentCollector({
        filter,
        time: 1000 * 60 * 2 // 2 minutes
      });

      collector.on('collect', async (i) => {
        if (i.customId === 'next') page++;
        if (i.customId === 'prev') page--;

        await i.update({
          embeds: [makeEmbed(page)],
          components: [makeButtons(page)]
        });
      });

      collector.on('end', async () => {
        if (msg.editable) {
          await msg.edit({
            components: []
          }).catch(() => {});
        }
      });

    } catch (error) {
      console.error('Error executing /heroku-logs command:', error);

      let errorMessage = 'An unexpected error occurred.';
      if (error.response) {
        errorMessage = `Heroku API Error: ${error.response.status} - ${error.response.data?.message || 'No specific message.'}`;
      } else if (error.request) {
        errorMessage = 'No response received from Heroku. The service might be down.';
      } else {
        errorMessage = `Error: ${error.message}`;
      }

      await interaction.editReply({ content: errorMessage });
    }
  },
};
