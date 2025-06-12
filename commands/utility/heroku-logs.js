const { SlashCommandBuilder, EmbedBuilder, embedLength } = require('discord.js');
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

    // Defer the reply, as API calls can take time.
    // Set ephemeral to true so logs are not publicly visible.
    await interaction.deferReply({ ephemeral: true });

    try {
        const { HEROKU_API_KEY, HEROKU_APP_NAME } = process.env;

        // Check if the environment variables are set on Heroku
        if (!HEROKU_API_KEY || !HEROKU_APP_NAME) {
            console.error("Heroku environment variables are missing.");
            return interaction.editReply({
                content: 'Error: The bot is not configured correctly on the server. Missing env variables.'
            });
        }

        const lines = interaction.options.getInteger('lines') ?? 50; //Default to 50 lines.

        // 1. Create a Log Session on Heroku to get a temporary URL for the logs
        const logSessionResponse = await axios.post(
            `https://api.heroku.com/apps/${HEROKU_APP_NAME}/log-sessions`,
            {
                lines: lines,
                tail: false,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/vnd.heroku+json; version=3',
                    'Authorization': `Bearer ${HEROKU_API_KEY}`,
                },
            }
        );

        const logURL = logSessionResponse.data.logplex_url;

        // 2. Fetch the raw log data from the tempporary URL
        const logsResponse = await axios.get(logURL);
        let logs = logsResponse.data;

        // 3. Format and send the logs
        if (!logs || logs.trim().length === 0) {
            return interaction.editReply({
                content: 'No logs were returned from Heroku.'
            });
        }

        // TRIVIA: Discord embeds have a 4096 character limit for the description. We will use 4000 to be safe.
        // di naman siguro lalagpas ng 4000 characters ung logs, except may error talaga.
        if (logs.length > 4000) {
            logs = `... (logs truncated to the last 4000 characters)... \n\n` + logs.slice(logs.length - 4000);
        }

        const embed = new EmbedBuilder()
            .setColor('#6567a5') // color ng heroku
            .setTitle(`📋 Last ${lines} Log lines for \`${HEROKU_APP_NAME}\``)
            .setDescription('```' + logs + '```') // Send logs inside a code block para astig
            .setTimestamp();

        await interaction.editReply({ embeds: [embed]});

    } catch (error) {
        console.error('Error executing /heroku-logs command:', error);

        // Create a user-friendly error message
        let errorMessage = 'An unexpected error occured.';
        if (error.response) {
            // request made and server responed with status code
            errorMessage = `Heroku API Error: ${error.response.status} - ${error.response.data?.message || 'No specific message.'}`;

        }
        else if (error.request) {
            // request was made but no response, kumbaga seenzoned ka lang.. kawawa naman...
            errorMessage = 'No response received from Heroku. The service might be down.';
        }
        else {
            // Something happened in setting up request that triggered an error.
            errorMessage = `Error: ${error.message}`;
        }

        await interaction.editReply({
            content: errorMessage
        });
    }
  },
};

