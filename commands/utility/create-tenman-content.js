const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const crypto = require('crypto');
const TaskQueue = require('./../../helper/taskQueue.js');

const isValidDateFormat = date => /^\d{4}-\d{2}-\d{2}$/.test(date);
const isValidTimeFormat = time => /^\d{2}:\d{2}$/.test(time);
const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-open-content')
    .setDescription('Create an event for open-world or WvW content')
    .addStringOption(opt => opt.setName('title').setDescription('Event title').setRequired(true))
    .addStringOption(opt => opt.setName('event-date').setDescription('Date (YYYY-MM-DD)').setRequired(true))
    .addStringOption(opt => opt.setName('event-time').setDescription('Time (HH:MM 24hr)').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const title = interaction.options.getString('title');
    const date = interaction.options.getString('event-date');
    const time = interaction.options.getString('event-time');
    const duration = interaction.options.getInteger('duration');

    const queue = new TaskQueue();

    if (!isValidDateFormat(date) || !isValidTimeFormat(time)) {
      return interaction.editReply({ content: '❌ Use format YYYY-MM-DD and HH:MM (24hr).' });
    }

    const startTime = new Date(`${date}T${time}:00`);
    if (isNaN(startTime) || startTime <= Date.now()) {
      return interaction.editReply({ content: '⚠️ Time must be in the future.' });
    }

    const endTime = new Date(startTime.getTime() + duration * 60000);
    const statusColors = {
      Scheduled: 0x57F287,
      InProgress: 0xFAA61A,
      Ended: 0xED4245,
      Canceled: 0x808080
    };
    const eventState = { status: 'Scheduled' };

    const emojis = {
      yes: '✅',
      maybe: '❔',
      no: '❌'
    };

    const votes = {
      yes: new Set(),
      maybe: new Set(),
      no: new Set()
    };

    const contentChannel = await interaction.guild.channels.fetch('1371750538626207754');
    if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: '❌ Cannot post in content channel.' });
    }

    const buildEmbed = () => {
      return new EmbedBuilder()
        .setColor(statusColors[eventState.status])
        .setTitle(`**[${shortId}] ${title}** | ⏱️ ${eventState.status}`)
        .setDescription(`📅 <t:${Math.floor(startTime.getTime() / 1000)}:F> (<t:${Math.floor(startTime.getTime() / 1000)}:R>)`)
        .addFields(
          { name: `${emojis.yes} Attending`, value: [...votes.yes].map(id => `<@${id}>`).join('\n') || 'None', inline: true },
          { name: `${emojis.maybe} Maybe`, value: [...votes.maybe].map(id => `<@${id}>`).join('\n') || 'None', inline: true },
          { name: `${emojis.no} Declined`, value: [...votes.no].map(id => `<@${id}>`).join('\n') || 'None', inline: true }
        )
        .setFooter({ text: 'All times shown in your local timezone. Powered by KOHI' });
    };

    const message = await contentChannel.send({ embeds: [buildEmbed()] });
    const thread = await message.startThread({
      name: `[${shortId}] ${title}`,
      autoArchiveDuration: 60,
      reason: 'Open content discussion'
    });

    await queue.add(async () => {
      for (const emoji of Object.values(emojis)) {
        try {
          await message.react(emoji);
          await new Promise(r => setTimeout(r, 300));
        } catch (e) {
          console.warn('Failed to react:', emoji, e.message);
        }
      }
    });

    const updateEmbedDebounced = () => {
      if (updateEmbedDebounced.timeout) clearTimeout(updateEmbedDebounced.timeout);
      updateEmbedDebounced.timeout = setTimeout(() => {
        queue.add(() => message.edit({ embeds: [buildEmbed()] }));
      }, 500);
    };

    const collector = message.createReactionCollector({
      dispose: true,
      filter: (reaction, user) => !user.bot && Object.values(emojis).includes(reaction.emoji.name)
    });

    collector.on('collect', (reaction, user) => {
      for (const set of Object.values(votes)) set.delete(user.id);
      if (reaction.emoji.name === emojis.yes) votes.yes.add(user.id);
      else if (reaction.emoji.name === emojis.maybe) votes.maybe.add(user.id);
      else if (reaction.emoji.name === emojis.no) votes.no.add(user.id);
      updateEmbedDebounced();
    });

    collector.on('remove', (reaction, user) => {
      for (const set of Object.values(votes)) set.delete(user.id);
      updateEmbedDebounced();
    });

    const setStatus = async (newStatus) => {
      eventState.status = newStatus;
      await queue.add(() => message.edit({ embeds: [buildEmbed()] }));
      if (newStatus !== 'Scheduled') collector.stop();
    };

    // Schedule lifecycle
    setTimeout(() => {
      if (eventState.status === 'Scheduled') setStatus('InProgress');
    }, startTime - Date.now());

    setTimeout(() => {
      if (eventState.status === 'InProgress') setStatus('Ended');
    }, endTime - Date.now());

    setTimeout(() => {
      for (const id of votes.yes) {
        queue.add(async () => {
          try {
            const user = await interaction.client.users.fetch(id);
            await user.send(`⏰ Reminder: **[${shortId}] ${title}** starts in 10 minutes!`);
          } catch (e) {
            console.warn(`Reminder failed: ${id}`, e.message);
          }
        });
      }
    }, startTime.getTime() - Date.now() - 10 * 60000);

    await interaction.editReply({ content: '✅ Open content event created!' });
  }
};
