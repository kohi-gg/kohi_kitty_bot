const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

// Utility functions
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
    .setName('create-open-content')
    .setDescription('Create an event for big squad content like Open World or WvW')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Title for the event')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('selection')
        .setDescription('Choose which role to tag')
        .setRequired(true)
        .addChoices(
          { name: 'KOHI WvW', value: 'kohiwvw' },
          { name: 'Open World', value: 'openworld' }
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
        .setDescription('Event duration in minutes')
        .setRequired(true)),

  async execute(interaction) {
    try {
      const title = interaction.options.getString('title');
      const eventType = interaction.options.getString('selection');
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

      const formattedStartTime = to12HourTime(startTime);
      const startTimestamp = `<t:${Math.floor(startTime / 1000)}:F>`;
      const timeRange = `<t:${Math.floor(startTime / 1000)}:t> – <t:${Math.floor(endTime / 1000)}:t>`;

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

      const emojiIds = { green_check: '1146979195713486909' };
      const rsvpRoles = {
        [`green_check:${emojiIds.green_check}`]: {
          name: 'Attending',
          emoji: `<:green_check:${emojiIds.green_check}>`,
          votes: new Set()
        }
      };

      const roleMentions = {
        kohiwvw: '1251077936899952680',
        openworld: '1178537577003896932'
      };

      const contentChannel = await interaction.guild.channels.fetch('1364930867591516250');
      if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
        return interaction.editReply({ content: '❌ Could not access the event channel. Contact an admin.' });
      }

      await contentChannel.send(`<@&${roleMentions[eventType]}>`);

      const buildEmbed = () => {
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

      for (const role of Object.values(rsvpRoles)) {
        await eventMessage.react(role.emoji).catch(console.error);
      }

      const collector = eventMessage.createReactionCollector({
        filter: (reaction, user) => !user.bot,
        time: endTime - now,
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
      });

      collector.on('remove', async (reaction, user) => {
        const emojiKey = getEmojiKey(reaction.emoji);
        const role = rsvpRoles[emojiKey];
        if (role) {
          role.votes.delete(user.id);
          await eventStatus.update();
        }
      });

      const eventId = Math.random().toString(36).substring(2, 8).toUpperCase();
      const thread = await contentChannel.threads.create({
        name: `${eventId} | ${title.slice(0, 50)} 📅 ${date} | ⏱️ ${formattedStartTime}`,
        autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
        reason: 'Event discussion thread'
      });

      const jumpMsg = await thread.send(`📌 [Event Details](https://discord.com/channels/${interaction.guild.id}/${contentChannel.id}/${eventMessage.id})`);
      await jumpMsg.pin().catch(() => {});

      await interaction.editReply({ content: '✅ Event created successfully!' });

      const timeUntilStart = startTime.getTime() - now;
      const timeUntilEnd = endTime.getTime() - now;

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
      if (cancelTime > now) {
        setTimeout(async () => {
          const allUserIds = getAllSignedUserIds(rsvpRoles);

          if (allUserIds.size >= 7 || eventStatus.status !== 'Scheduled') return;

          try {
            const dm = await interaction.user.send({
              content: `⚠️ Only **${allUserIds.size}** users signed up for **${eventId} | ${title}**. Do you want to continue or cancel?`,
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
        }, cancelTime - now);
      }

      async function cancelEvent() {
        eventStatus.status = 'Canceled';
        await eventStatus.update();

        for (const userId of getAllSignedUserIds(rsvpRoles)) {
          try {
            const user = await interaction.client.users.fetch(userId);
            await user.send(`❌ The event **${eventId} | ${title}** was canceled.`);
          } catch {}
        }

        collector.stop();
        eventMessage.reactions.removeAll().catch(() => {});
      }

    } catch (error) {
      console.error('Failed to create event:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: '❌ Unexpected error occurred while creating the event.' });
      } else {
        await interaction.reply({ content: '❌ Unexpected error occurred.', ephemeral: true });
      }
    }
  }
};
