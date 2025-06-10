const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder
} = require('discord.js');
const crypto = require('crypto');
const TaskQueue = require('./../../helper/taskQueue.js'); // Make sure this path matches your structure

const queue = new TaskQueue();
const isValidDateFormat = date => /^\d{4}-\d{2}-\d{2}$/.test(date);
const isValidTimeFormat = time => /^\d{2}:\d{2}$/.test(time);
const getEmojiKey = emoji => `${emoji.name}:${emoji.id}`;
const wait = ms => new Promise(res => setTimeout(res, ms));

const getAllSignedUserIds = (roles) => {
  const ids = new Set();
  for (const role of Object.values(roles)) {
    for (const user of role.votes) ids.add(user.id || user);
  }
  return ids;
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-open-content')
    .setDescription('Create an event for open world or WvW content')
    .addStringOption(opt => opt.setName('title').setDescription('Your preferred title').setRequired(true))
    .addStringOption(opt => opt
      .setName('selection')
      .setDescription('Choose content')
      .setRequired(true)
      .addChoices(
        { name: 'Open World', value: 'openworld' },
        { name: 'WvW', value: 'wvw' }
      ))
    .addStringOption(opt => opt.setName('event-date').setDescription('YYYY-MM-DD').setRequired(true))
    .addStringOption(opt => opt.setName('event-time').setDescription('HH:MM 24hr').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const shortId = crypto.randomBytes(2).toString('hex').toUpperCase(); // Unique 4-char ID
    const title = interaction.options.getString('title');
    const selection = interaction.options.getString('selection');
    const date = interaction.options.getString('event-date');
    const time = interaction.options.getString('event-time');
    const duration = interaction.options.getInteger('duration');

    if (!isValidDateFormat(date) || !isValidTimeFormat(time)) {
      return interaction.editReply({ content: '❌ Use date format YYYY-MM-DD and time HH:MM (24hr).' });
    }

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    if (isNaN(startTime) || startTime <= Date.now()) {
      return interaction.editReply({ content: '⚠️ Event time must be in the future.' });
    }

    const eventState = { status: 'Scheduled' };
    const statusColors = {
      'Scheduled': 0x57F287,
      'In Progress': 0xFAA61A,
      'Ended': 0xED4245,
      'Canceled': 0x808080
    };

    const emojiIds = {
      green_check: '1146979195713486909'
    };

    const roles = {
      [`green_check:${emojiIds.green_check}`]: { name: 'Attendee', emoji: `<:green_check:${emojiIds.green_check}>`, max: 99, votes: new Set() }
    };

    const roleMentions = {
      openworld: '1178537577003896932',
      wvw: '1251077936899952680'
    };

    const contentChannel = await interaction.guild.channels.fetch('1371750538626207754');
    if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: '❌ Cannot access event channel.' });
    }

    await contentChannel.send(`<@&${roleMentions[selection]}>`);

    const buildEmbed = () => {
      const startUnix = Math.floor(startTime.getTime() / 1000);
      const endUnix = Math.floor(endTime.getTime() / 1000);

      const roleFields = Object.values(roles).map(role => ({
        name: `${role.name} ${role.emoji}`,
        value: `${role.votes.size}/${role.max}\n${[...role.votes].map(u => `<@${u.id}>`).join('\n') || 'None'}`,
        inline: true
      }));

      return new EmbedBuilder()
        .setColor(statusColors[eventState.status])
        .setTitle(`**[${shortId}] ${title}** | <t:${startUnix}:t>–<t:${endUnix}:t> | ${eventState.status}`)
        .setDescription(`<:catmander_cyan:1160045420324597782><@${interaction.user.id}> use **/sqjoin /join + hostname** to join. Discuss in thread.`)
        .addFields(
          { name: 'Event Time (Local)', value: `<t:${startUnix}:F>` },
          { name: 'Starts In', value: `<t:${startUnix}:R>`, inline: true },
          ...roleFields
        )
        .setFooter({ text: `ID: ${shortId} • All times in your local timezone. Powered by KOHI` });
    };

    const message = await contentChannel.send({ embeds: [buildEmbed()] });

    const thread = await message.startThread({
      name: `[${shortId}] ${title}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay
    });

    const updateEmbed = async () => queue.add(() => message.edit({ embeds: [buildEmbed()] }));

    const setStatus = async (newStatus, options = {}) => {
      eventState.status = newStatus;
      await updateEmbed();

      if (options.stopCollector && collector) collector.stop();
      if (options.clearReactions) message.reactions.removeAll().catch(() => {});
      if (options.notifyUsers && options.notifyMessage) {
        for (const userId of getAllSignedUserIds(roles)) {
          queue.add(async () => {
            try {
              const user = await interaction.client.users.fetch(userId);
              await user.send(options.notifyMessage);
            } catch {}
          });
        }
      }
    };

    for (const key of Object.keys(roles)) {
      queue.add(() => message.react(roles[key].emoji));
      await wait(250); // delay to avoid rate limits
    }

    const validEmojiKeys = new Set(Object.keys(roles));
    const mentionedInThread = new Set();

    const collector = message.createReactionCollector({
      filter: (reaction, user) =>
        !user.bot && validEmojiKeys.has(getEmojiKey(reaction.emoji)),
      dispose: true
    });

    collector.on('collect', async (reaction, user) => {
      const emojiKey = getEmojiKey(reaction.emoji);
      const role = roles[emojiKey];
      if (!role || eventState.status !== 'Scheduled') {
        await reaction.users.remove(user.id);
        return user.send('⚠️ Signups are closed.').catch(() => {});
      }

      if (role.votes.size >= role.max) {
        await reaction.users.remove(user.id);
        return user.send(`❌ Slot full for ${role.name}.`).catch(() => {});
      }

      for (const [key, r] of Object.entries(roles)) {
        if (key !== emojiKey && r.votes.has(user)) {
          r.votes.delete(user);
          const rReact = message.reactions.cache.find(r => getEmojiKey(r.emoji) === key);
          if (rReact) await rReact.users.remove(user.id);
        }
      }

      role.votes.add(user);
      updateEmbed();

      if (!mentionedInThread.has(user.id)) {
        mentionedInThread.add(user.id);
        thread.send(`👋 <@${user.id}> signed up as **${role.name}**!`);
      }
    });

    collector.on('remove', async (reaction, user) => {
      const emojiKey = getEmojiKey(reaction.emoji);
      if (roles[emojiKey]) {
        roles[emojiKey].votes.delete(user);
        updateEmbed();
      }
    });

    await interaction.editReply({ content: `✅ Event **[${shortId}] ${title}** created.` });

    const now = Date.now();
    const timeUntilStart = startTime - now;
    const timeUntilEnd = endTime - now;

    setTimeout(() => {
      if (eventState.status !== 'Canceled') setStatus('In Progress');
    }, timeUntilStart);

    setTimeout(() => {
      if (eventState.status !== 'Canceled') setStatus('Ended', { stopCollector: true, clearReactions: true });
    }, timeUntilEnd);

    const reminderTime = startTime.getTime() - 10 * 60 * 1000;
    if (reminderTime > now) {
      setTimeout(() => {
        for (const userId of getAllSignedUserIds(roles)) {
          queue.add(async () => {
            try {
              const user = await interaction.client.users.fetch(userId);
              await user.send(`⏰ Reminder: **[${shortId}] ${title}** starts in 10 minutes!`);
            } catch {}
          });
        }
      }, reminderTime - now);
    }

    const cancelTime = startTime.getTime() - 5 * 60 * 1000;
    if (cancelTime > now) {
      setTimeout(async () => {
        const allUserIds = getAllSignedUserIds(roles);
        if (allUserIds.size >= 7 || eventState.status !== 'Scheduled') return;

        try {
          const dm = await interaction.user.send({
            content: `⚠️ Only **${allUserIds.size}** users signed up for **[${shortId}] ${title}**. Continue or Cancel?`,
            components: [{
              type: 1,
              components: [
                { type: 2, label: '✅ Continue', style: 3, custom_id: 'continue_event' },
                { type: 2, label: '❌ Cancel', style: 4, custom_id: 'cancel_event' }
              ]
            }]
          });

          const dmCollector = dm.createMessageComponentCollector({ time: 120000, max: 1 });

          dmCollector.on('collect', async (btn) => {
            await btn.deferUpdate();
            if (btn.customId === 'continue_event') {
              await btn.followUp({ content: '👍 Event will continue.', ephemeral: true });
            } else {
              await setStatus('Canceled', {
                stopCollector: true,
                clearReactions: true,
                notifyUsers: true,
                notifyMessage: `❌ The event **[${shortId}] ${title}** has been canceled.`
              });
              await btn.followUp({ content: '❌ Event canceled.', ephemeral: true });
            }
          });

          dmCollector.on('end', async collected => {
            if (collected.size === 0 && eventState.status === 'Scheduled') {
              await setStatus('Canceled', {
                stopCollector: true,
                clearReactions: true,
                notifyUsers: true,
                notifyMessage: `❌ The event **[${shortId}] ${title}** was canceled due to low signups and no host response.`
              });
            }
          });

        } catch (err) {
          console.error('DM to host failed:', err);
        }
      }, cancelTime - now);
    }
  }
};
