// create-event.js
const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const isValidDateFormat = date => /^\d{4}-\d{2}-\d{2}$/.test(date);
const isValidTimeFormat = time => /^\d{2}:\d{2}$/.test(time);
const to12HourTime = date => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const getEmojiKey = emoji => `${emoji.name}:${emoji.id}`;
const getAllSignedUserIds = roles => {
  const ids = new Set();
  for (const role of Object.values(roles)) {
    for (const user of role.votes) ids.add(user.id || user);
  }
  return ids;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-event')
    .setDescription('Create an event (open world, 10-man, or 5-man)')
    .addStringOption(option =>
      option.setName('event-type')
        .setDescription('Type of content')
        .setRequired(true)
        .addChoices(
          { name: 'Open World / WvW', value: 'open' },
          { name: '10-man (Raids/Strikes)', value: 'tenman' },
          { name: '5-man (Fractals/Dungeons)', value: 'fiveman' }
        ))
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title of the event')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('selection')
        .setDescription('Choose sub-type of content')
        .setRequired(true)
        .addChoices(
          { name: 'KOHI WvW', value: 'kohiwvw' },
          { name: 'Open World', value: 'openworld' },
          { name: 'Raids', value: 'raids' },
          { name: 'Strikes', value: 'strikes' },
          { name: 'Fractals', value: 'fractals' },
          { name: 'Dungeon', value: 'dungeon' }
        ))
    .addStringOption(option =>
      option.setName('event-date')
        .setDescription('Event date (YYYY-MM-DD)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('event-time')
        .setDescription('Event time (HH:MM in 24hr format)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration in minutes')
        .setRequired(true)),

  async execute(interaction) {
    const eventType = interaction.options.getString('event-type');
    const title = interaction.options.getString('title');
    const selection = interaction.options.getString('selection');
    const date = interaction.options.getString('event-date');
    const time = interaction.options.getString('event-time');
    const duration = interaction.options.getInteger('duration');

    if (!isValidDateFormat(date) || !isValidTimeFormat(time)) {
      return interaction.reply({ content: '❌ Invalid date or time format. Use YYYY-MM-DD and HH:MM (24hr).', ephemeral: true });
    }

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const now = Date.now();

    if (isNaN(startTime) || startTime <= now) {
      return interaction.reply({ content: '⚠️ The event must be scheduled for a future time.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    // Delegate to event-type-specific logic
    if (eventType === 'open') {
      const openHandler = require('../../helper/open-event-handler.js');
      return await openHandler(interaction, { title, selection, startTime, endTime });
    }
    if (eventType === 'tenman') {
      const tenmanHandler = require('../../helper/ten-man-event-handler.js');
      return await tenmanHandler(interaction, { title, selection, startTime, endTime });
    }
    if (eventType === 'fiveman') {
      const fivemanHandler = require('../../helper/five-man-handler.js');
      return await fivemanHandler(interaction, { title, selection, startTime, endTime });
    }

    return interaction.editReply({ content: '❌ Unknown event type.' });
  }
};
