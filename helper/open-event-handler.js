// handlers/openEventHandler.js
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

module.exports = async function handleOpenEvent(interaction, { title, selection, startTime, endTime }) {
  const contentChannel = await interaction.guild.channels.fetch('1371750538626207754');
  if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
    return interaction.editReply({ content: '❌ Could not access the event channel. Contact an admin.' });
  }

  const roleMentions = {
    kohiwvw: '1251077936899952680',
    openworld: '1178537577003896932'
  };

  const emojiIds = {
    green_check: '1146979195713486909'
  };

  const rsvpRoles = {
    [`green_check:${emojiIds.green_check}`]: {
      name: 'Attending',
      emoji: `<:green_check:${emojiIds.green_check}>`,
      votes: new Set()
    }
  };

  const eventStatus = {
    status: 'Scheduled',
    colorMap: {
      Scheduled: 0x57F287,
      'In Progress': 0xFAA61A,
      Ended: 0xED4245,
      Canceled: 0xED4245
    },
    async update() {
      await eventMessage.edit({ embeds: [buildEmbed()] });
    }
  };

  await contentChannel.send(`<@&${roleMentions[selection]}>`);

  const buildEmbed = () => {
    const timeRange = `<t:${Math.floor(startTime / 1000)}:t> – <t:${Math.floor(endTime / 1000)}:t>`;
    const startTimestamp = `<t:${Math.floor(startTime / 1000)}:F>`;

    const fields = Object.values(rsvpRoles).map(role => ({
      name: `${role.name} ${role.emoji}`,
      value: `${role.votes.size} attending\n${[...role.votes].map(id => `<@${id}>`).join('\n') || 'None'}`,
      inline: true
    }));

    return new EmbedBuilder()
      .setColor(eventStatus.colorMap[eventStatus.status])
      .setTitle(`**${title}** | ${timeRange} | ⏱️ ${eventStatus.status}`)
      .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
      .setDescription(`<:catmander_cyan:1160045420324597782> <@${interaction.user.id}> — ***Discuss event details in the thread below!***`)
      .addFields(
        { name: 'Event Time (Local)', value: startTimestamp, inline: true },
        { name: 'Starts In', value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: true },
        ...fields
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

  for (const role of Object.values(rsvpRoles)) {
    await eventMessage.react(role.emoji).catch(console.error);
  }

  const validEmojis = new Set(Object.keys(rsvpRoles));
  const mentionedInThread = new Set();

  const collector = eventMessage.createReactionCollector({
    filter: (reaction, user) => !user.bot && validEmojis.has(getEmojiKey(reaction.emoji)),
    dispose: true
  });

  collector.on('collect', async (reaction, user) => {
    const emojiKey = getEmojiKey(reaction.emoji);
    const role = rsvpRoles[emojiKey];

    if (!role || eventStatus.status !== 'Scheduled') {
      await reaction.users.remove(user.id);
      return user.send(`⚠️ You can't RSVP to **${title}** right now.`).catch(() => {});
    }

    for (const [key, otherRole] of Object.entries(rsvpRoles)) {
      if (key !== emojiKey && otherRole.votes.has(user.id)) {
        otherRole.votes.delete(user.id);
        const otherReaction = eventMessage.reactions.cache.find(r => getEmojiKey(r.emoji) === key);
        if (otherReaction) await otherReaction.users.remove(user.id);
      }
    }

    role.votes.add(user.id);
    await eventStatus.update();

    if (!mentionedInThread.has(user.id)) {
      mentionedInThread.add(user.id);
      thread.send(`👋 <@${user.id}> signed up as **${role.name}**!`);
    }
  });

  collector.on('remove', async (reaction, user) => {
    const emojiKey = getEmojiKey(reaction.emoji);
    const role = rsvpRoles[emojiKey];
    if (role) {
      role.votes.delete(user.id);
      await eventStatus.update();
    }
  });

  const timeUntilStart = startTime.getTime() - Date.now();
  const timeUntilEnd = endTime.getTime() - Date.now();

  setTimeout(() => {
    eventStatus.status = 'In Progress';
    eventStatus.update();
  }, timeUntilStart);

  setTimeout(() => {
    eventStatus.status = 'Ended';
    collector.stop();
    eventStatus.update();
    eventMessage.reactions.removeAll().catch(() => {});
  }, timeUntilEnd);

  const cancelTime = startTime.getTime() - 5 * 60 * 1000;
  if (cancelTime > Date.now()) {
    setTimeout(async () => {
      const allUserIds = getAllSignedUserIds(rsvpRoles);

      if (allUserIds.size >= 7 || eventStatus.status !== 'Scheduled') return;

      try {
        const dm = await interaction.user.send({
          content: `⚠️ Only **${allUserIds.size}** users signed up for **${title}**. Continue or cancel?`,
          components: [new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('continue_event').setLabel('✅ Continue').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId('cancel_event').setLabel('❌ Cancel').setStyle(ButtonStyle.Danger)
          )]
        });

        const btn = await dm.awaitMessageComponent({ time: 2 * 60 * 1000 }).catch(() => null);

        if (!btn) {
          await cancelEvent();
        } else if (btn.customId === 'continue_event') {
          await btn.update({ content: '👍 Event will proceed!', components: [] });
        } else {
          await cancelEvent();
          await btn.update({ content: '❌ Event canceled.', components: [] });
        }
      } catch (err) {
        console.error('❌ Failed to DM event host:', err);
      }
    }, cancelTime - Date.now());
  }

  async function cancelEvent() {
    eventStatus.status = 'Canceled';
    await eventStatus.update();

    for (const userId of getAllSignedUserIds(rsvpRoles)) {
      try {
        const user = await interaction.client.users.fetch(userId);
        await user.send(`❌ The event **${title}** was canceled.`);
      } catch {}
    }

    collector.stop();
    eventMessage.reactions.removeAll().catch(() => {});
  }

  await interaction.editReply({ content: '✅ Open world/WvW event created successfully!' });
};
