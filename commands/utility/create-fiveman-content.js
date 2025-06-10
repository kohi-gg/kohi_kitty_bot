const {
  SlashCommandBuilder,
  ChannelType,
  EmbedBuilder
} = require('discord.js');
const crypto = require('crypto');
const TaskQueue = require('./../../helper/taskQueue.js');

const isValidDateFormat = date => /^\d{4}-\d{2}-\d{2}$/.test(date);
const isValidTimeFormat = time => /^\d{2}:\d{2}$/.test(time);
const getAllSignedUserIds = (roles) => {
  const ids = new Set();
  for (const role of Object.values(roles)) {
    for (const user of role.votes) ids.add(user.id || user);
  }
  return ids;
};
const getEmojiKey = emoji => `${emoji.name}:${emoji.id}`;

const shortId = crypto.randomBytes(2).toString('hex').toUpperCase();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-fiveman-content')
    .setDescription('Create a 5-man content event')
    .addStringOption(opt => opt.setName('title').setDescription('Event title').setRequired(true))
    .addStringOption(opt => opt.setName('event-date').setDescription('Event date (YYYY-MM-DD)').setRequired(true))
    .addStringOption(opt => opt.setName('event-time').setDescription('Event time (HH:MM 24hr)').setRequired(true))
    .addIntegerOption(opt => opt.setName('duration').setDescription('Duration in minutes').setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const queue = new TaskQueue();

    const title = interaction.options.getString('title');
    const date = interaction.options.getString('event-date');
    const time = interaction.options.getString('event-time');
    const duration = interaction.options.getInteger('duration');

    if (!isValidDateFormat(date) || !isValidTimeFormat(time)) {
      return interaction.editReply({ content: '❌ Invalid date or time format. Use YYYY-MM-DD and HH:MM (24hr).' });
    }

    const MS_IN_MIN = 60000;
    const startTime = new Date(`${date}T${time}:00`);
    if (isNaN(startTime) || startTime <= Date.now()) {
      return interaction.editReply({ content: '⚠️ The event time must be in the future.' });
    }
    const endTime = new Date(startTime.getTime() + duration * MS_IN_MIN);

    const eventState = { status: 'Scheduled' };

    const statusColors = {
      'Scheduled': 0x57F287,
      'In Progress': 0xFAA61A,
      'Ended': 0xED4245,
      'Canceled': 0x808080
    };

    const emojiIds = {
      tank: '1146979167330644019',
      dps: '1149886591922352219',
      fill: '782478971471265804'
    };

    const roles = {
      [`tank:${emojiIds.tank}`]: { name: 'Tank/Heal', emoji: `<:heart:${emojiIds.tank}>`, max: 1, votes: new Set() },
      [`dps:${emojiIds.dps}`]: { name: 'DPS', emoji: `<:dps:${emojiIds.dps}>`, max: 3, votes: new Set() },
      [`fill:${emojiIds.fill}`]: { name: 'Fill', emoji: `<:uwu:${emojiIds.fill}>`, max: 1, votes: new Set() }
    };

    const contentChannel = await interaction.guild.channels.fetch('1371750538626207754');
    if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: '❌ Cannot access the content channel or it is not a text channel.' });
    }

    const buildEmbed = () => {
      const startTimestamp = `<t:${Math.floor(startTime / 1000)}:F>`;
      const timeRange = `<t:${Math.floor(startTime / 1000)}:t> – <t:${Math.floor(endTime / 1000)}:t>`;

      const roleFields = Object.values(roles).map(role => ({
        name: `${role.name} ${role.emoji}`,
        value: `${role.votes.size}/${role.max}\n${[...role.votes].map(u => `<@${u.id || u}>`).join('\n') || 'None'}`,
        inline: true
      }));

      return new EmbedBuilder()
        .setColor(statusColors[eventState.status])
        .setTitle(`**[${shortId}] ${title}** | ${timeRange} |⏱️ ${eventState.status}`)
        .setDescription(`<:catmander_cyan:1160045420324597782><@${interaction.user.id}> use **/sqjoin /join + hostname/commander** to join.`)
        .addFields(
          { name: 'Event Time (Local)', value: startTimestamp },
          { name: 'Starts In', value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: true },
          ...roleFields
        )
        .setFooter({ text: `All times shown in your local timezone | ID: ${shortId}` });
    };

    const message = await contentChannel.send({ embeds: [buildEmbed()] });

    const wait = ms => new Promise(res => setTimeout(res, ms));
    queue.add(async () => {
      for (const role of Object.values(roles)) {
        try {
          await message.react(role.emoji);
          await wait(300);
        } catch (e) {
          console.warn('Failed to react:', role.name, e.message);
        }
      }
    });

    const validEmojiKeys = new Set(Object.keys(roles));
    const mentionedInThread = new Set();

    const filter = (reaction, user) => {
      if (user.bot) return false;
      const key = getEmojiKey(reaction.emoji);
      return validEmojiKeys.has(key);
    };

    const collector = message.createReactionCollector({ filter, dispose: true });

    const thread = await message.startThread({
      name: `[${shortId}] ${title}`,
      autoArchiveDuration: 60,
      reason: 'Discussion for five-man event'
    });

    const updateEmbedDebounced = () => {
      if (updateEmbedDebounced.timeout) clearTimeout(updateEmbedDebounced.timeout);
      updateEmbedDebounced.timeout = setTimeout(() => {
        queue.add(() => message.edit({ embeds: [buildEmbed()] }));
      }, 500);
    };

    collector.on('collect', async (reaction, user) => {
      const emojiKey = getEmojiKey(reaction.emoji);
      const role = roles[emojiKey];
      if (!role || eventState.status !== 'Scheduled') {
        await reaction.users.remove(user.id);
        return queue.add(() => user.send(`⚠️ You can't sign up right now.`).catch(() => {}));
      }

      if (role.votes.size >= role.max) {
        await reaction.users.remove(user.id);
        return queue.add(() => user.send(`❌ Sorry! The slot for ${role.name} is full.`).catch(() => {}));
      }

      for (const [otherKey, otherRole] of Object.entries(roles)) {
        if (otherKey !== emojiKey && otherRole.votes.has(user)) {
          otherRole.votes.delete(user);
          const otherReaction = message.reactions.cache.find(r => getEmojiKey(r.emoji) === otherKey);
          if (otherReaction) await otherReaction.users.remove(user.id);
        }
      }

      role.votes.add(user);
      updateEmbedDebounced();

      if (!mentionedInThread.has(user.id)) {
        mentionedInThread.add(user.id);
        queue.add(() => thread.send(`👋 <@${user.id}> signed up as **${role.name}**!`));
      }
    });

    collector.on('remove', async (reaction, user) => {
      const emojiKey = getEmojiKey(reaction.emoji);
      const role = roles[emojiKey];
      if (role) {
        role.votes.delete(user);
        updateEmbedDebounced();
      }
    });

    const setStatus = async (newStatus, options = {}) => {
      eventState.status = newStatus;
      await queue.add(() => message.edit({ embeds: [buildEmbed()] }));

      if (options.stopCollector && collector) collector.stop();
      if (options.clearReactions && message) {
        queue.add(() => message.reactions.removeAll().catch(() => {}));
      }

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

    await interaction.editReply({ content: '✅ 5-man event created successfully!' });

    setTimeout(() => {
      if (eventState.status !== 'Canceled') setStatus('In Progress');
    }, startTime - Date.now());

    setTimeout(() => {
      if (eventState.status !== 'Canceled') setStatus('Ended', { stopCollector: true, clearReactions: true });
    }, endTime - Date.now());

    setTimeout(() => {
      const signedUserIds = getAllSignedUserIds(roles);
      for (const userId of signedUserIds) {
        queue.add(async () => {
          try {
            const user = await interaction.client.users.fetch(userId);
            await user.send(`⏰ Reminder: **[${shortId}] ${title}** starts in 10 minutes! Get ready!`);
          } catch (e) {
            console.warn(`Reminder DM failed for ${userId}: ${e.message}`);
          }
        });
      }
      queue.add(async () => {
        try {
          await interaction.user.send(`⏰ Heads-up! Your event **[${shortId}] ${title}** starts in 10 minutes.`);
        } catch (e) {
          console.warn(`Reminder DM to host failed: ${e.message}`);
        }
      });
    }, startTime.getTime() - 10 * 60 * 1000 - Date.now());

    setTimeout(() => {
      if (eventState.status === 'Scheduled') {
        const totalSignups = [...Object.values(roles)].reduce((acc, role) => acc + role.votes.size, 0);
        if (totalSignups < 4) {
          setStatus('Canceled', {
            stopCollector: true,
            clearReactions: true,
            notifyUsers: true,
            notifyMessage: `❌ The event **[${shortId}] ${title}** was canceled due to insufficient signups.`
          });
        }
      }
    }, startTime.getTime() - Date.now() - 5 * 60 * 1000);
  }
};
