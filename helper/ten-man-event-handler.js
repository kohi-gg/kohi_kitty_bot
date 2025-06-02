// handlers/tenmanEventHandler.js
const { ChannelType, ThreadAutoArchiveDuration, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const to12HourTime = date => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
const getEmojiKey = emoji => `${emoji.name}:${emoji.id}`;
const getAllSignedUserIds = roles => {
  const ids = new Set();
  for (const role of Object.values(roles)) {
    for (const user of role.votes) ids.add(user.id || user);
  }
  return ids;
};

module.exports = async function handleTenmanEvent(interaction, { title, selection, startTime, endTime }) {
  const contentChannel = await interaction.guild.channels.fetch('1371750538626207754');
  if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
    return interaction.editReply({ content: '❌ Could not access the event channel. Contact an admin.' });
  }

  const roleMentions = {
    raids: '1149898360954835044',
    strikes: '1149898797921611887'
  };

  const emojiIds = {
    tank: '1146979167330644019',
    boon: '1149886586369085510',
    dps: '1149886591922352219',
    fill: '782478971471265804'
  };

  const roles = {
    [`heart:${emojiIds.tank}`]: { name: 'Tank/Heal', emoji: `<:heart:${emojiIds.tank}>`, max: 2, votes: new Set() },
    [`alacrity:${emojiIds.boon}`]: { name: 'BoonDPS', emoji: `<:alacrity:${emojiIds.boon}>`, max: 2, votes: new Set() },
    [`dps:${emojiIds.dps}`]: { name: 'DPS', emoji: `<:dps:${emojiIds.dps}>`, max: 6, votes: new Set() },
    [`uwu:${emojiIds.fill}`]: { name: 'Fills', emoji: `<:uwu:${emojiIds.fill}>`, max: 5, votes: new Set() }
  };

  const statusColors = {
    Scheduled: 0x57F287,
    'In Progress': 0xFAA61A,
    Ended: 0xED4245,
    Canceled: 0x808080
  };

  const eventState = { status: 'Scheduled' };

  await contentChannel.send(`<@&${roleMentions[selection]}>`);

  const buildEmbed = () => {
    const timeRange = `<t:${Math.floor(startTime / 1000)}:t> – <t:${Math.floor(endTime / 1000)}:t>`;
    const startTimestamp = `<t:${Math.floor(startTime / 1000)}:F>`;

    const roleFields = Object.values(roles).map(role => ({
      name: `${role.name} ${role.emoji}`,
      value: `${role.votes.size}/${role.max}\n${[...role.votes].map(u => `<@${u.id || u}>`).join('\n') || 'None'}`,
      inline: true
    }));

    return new EmbedBuilder()
      .setColor(statusColors[eventState.status])
      .setTitle(`**${title}** | ${timeRange} | ⏱️ ${eventState.status}`)
      .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
      .setDescription(`<:catmander_cyan:1160045420324597782> <@${interaction.user.id}> — ***Use the thread below to discuss roles and details.***`)
      .addFields(
        { name: 'Event Time (Local)', value: startTimestamp, inline: true },
        { name: 'Starts In', value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: true },
        ...roleFields
      )
      .setFooter({ text: 'All times are shown in your local timezone. Powered by KOHI.' });
  };

  const eventMessage = await contentChannel.send({ embeds: [buildEmbed()] });
  const thread = await contentChannel.threads.create({
    name: `${Math.random().toString(36).substring(2, 8).toUpperCase()} | ${title.slice(0, 50)} 📅 ${startTime.toISOString().split('T')[0]} | ⏱️ ${to12HourTime(startTime)}`,
    autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
    reason: 'Event discussion thread'
  });
  const jumpMsg = await thread.send(`📌 [Event Details](https://discord.com/channels/${interaction.guild.id}/${contentChannel.id}/${eventMessage.id})`);
  await jumpMsg.pin().catch(() => {});

  for (const role of Object.values(roles)) {
    await eventMessage.react(role.emoji).catch(() => {});
  }

  const validEmojis = new Set(Object.keys(roles));
  const mentionedInThread = new Set();

  const updateEmbed = async () => {
    await eventMessage.edit({ embeds: [buildEmbed()] });
  };

  const collector = eventMessage.createReactionCollector({
    filter: (reaction, user) => !user.bot && validEmojis.has(getEmojiKey(reaction.emoji)),
    dispose: true
  });

  collector.on('collect', async (reaction, user) => {
    const emojiKey = getEmojiKey(reaction.emoji);
    const role = roles[emojiKey];

    if (!role || eventState.status !== 'Scheduled') {
      await reaction.users.remove(user.id);
      return user.send(`⚠️ You can't sign up to **${title}** right now.`).catch(() => {});
    }

    if (role.votes.size >= role.max) {
      await reaction.users.remove(user.id);
      return user.send(`❌ Sorry! The slot for ${role.name} is full.`).catch(() => {});
    }

    for (const [otherKey, otherRole] of Object.entries(roles)) {
      if (otherKey !== emojiKey && otherRole.votes.has(user.id || user)) {
        otherRole.votes.delete(user.id || user);
        const otherReaction = eventMessage.reactions.cache.find(r => getEmojiKey(r.emoji) === otherKey);
        if (otherReaction) await otherReaction.users.remove(user.id);
      }
    }

    role.votes.add(user);
    await updateEmbed();

    if (!mentionedInThread.has(user.id)) {
      mentionedInThread.add(user.id);
      thread.send(`👋 <@${user.id}> signed up as **${role.name}**!`);
    }
  });

  collector.on('remove', async (reaction, user) => {
    const emojiKey = getEmojiKey(reaction.emoji);
    const role = roles[emojiKey];
    if (role) {
      role.votes.delete(user);
      await updateEmbed();
    }
  });

  const shortId = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timeUntilStart = startTime.getTime() - Date.now();
  const timeUntilEnd = endTime.getTime() - Date.now();

  const setStatus = async (newStatus, options = {}) => {
    eventState.status = newStatus;
    await updateEmbed();

    if (options.stopCollector && collector) collector.stop();
    if (options.clearReactions && eventMessage) eventMessage.reactions.removeAll().catch(() => {});
    if (options.notifyUsers && options.notifyMessage) {
      for (const userId of getAllSignedUserIds(roles)) {
        try {
          const user = await interaction.client.users.fetch(userId);
          await user.send(options.notifyMessage);
        } catch {}
      }
    }
  };

  setTimeout(() => setStatus('In Progress'), timeUntilStart);
  setTimeout(() => setStatus('Ended', { stopCollector: true, clearReactions: true }), timeUntilEnd);

  const cancelTime = startTime.getTime() - 5 * 60 * 1000;
  if (cancelTime > Date.now()) {
    setTimeout(async () => {
      const allUserIds = getAllSignedUserIds(roles);
      if (allUserIds.size >= 7 || eventState.status !== 'Scheduled') return;

      try {
        const dm = await interaction.user.send({
          content: `⚠️ Only **${allUserIds.size}** users signed up for **${shortId} | ${title}**. Continue or cancel?`,
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('continue_event').setLabel('✅ Continue').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_event').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger)
          )]
        });

        const btn = await dm.awaitMessageComponent({ time: 2 * 60 * 1000 }).catch(() => null);

        if (!btn) return setStatus('Canceled', { stopCollector: true, clearReactions: true, notifyUsers: true, notifyMessage: `❌ The event **${shortId} | ${title}** was canceled.` });

        if (btn.customId === 'continue_event') {
          await btn.update({ content: '👍 Event will proceed!', components: [] });
        } else {
          await setStatus('Canceled', { stopCollector: true, clearReactions: true, notifyUsers: true, notifyMessage: `❌ The event **${shortId} | ${title}** was canceled.` });
          await btn.update({ content: '❌ Event canceled.', components: [] });
        }
      } catch (err) {
        console.error('Failed to DM event host:', err);
      }
    }, cancelTime - Date.now());
  }

  await interaction.editReply({ content: '✅ 10-man event created successfully!' });
};
