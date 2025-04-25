const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-open-content')
    .setDescription('Create an event for big squad like open world or WvW')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Your preferred title for this content')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('selection')
        .setDescription('Choose roles to tag')
        .setRequired(true)
        .addChoices(
          { name: 'KOHI WvW', value: 'kohiwvw' },
          { name: 'Open World', value: 'openworld' }
        ))
    .addStringOption(option =>
      option.setName('event-date')
        .setDescription('Date of the event (YYYY-MM-DD)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('event-time')
        .setDescription('Time of the event (HH:MM in 24hr format)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration of the event in minutes')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const title = interaction.options.getString('title');
    const selection = interaction.options.getString('selection');
    const date = interaction.options.getString('event-date');
    const time = interaction.options.getString('event-time');
    const duration = interaction.options.getInteger('duration');

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const now = Date.now();

    if (isNaN(startTime)) {
      return interaction.editReply({ content: '❌ Invalid date or time format. Use YYYY-MM-DD and HH:MM (24hr).' });
    }

    if (startTime <= now) {
      return interaction.editReply({ content: '⚠️ The event time must be in the future.' });
    }

    const startTimestamp = `<t:${Math.floor(startTime / 1000)}:F>`;
    const timeRange = `<t:${Math.floor(startTime / 1000)}:t> – <t:${Math.floor(endTime / 1000)}:t>`;
    const to12h = date => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    const formattedStartTime = to12h(startTime);

    let status = 'Scheduled';
    const statusColors = {
      'Scheduled': 0x57F287,
      'In Progress': 0xFAA61A,
      'Ended': 0xED4245
    };

    const emojiIds = {
      green_check: '1146979195713486909',
    };

    const roles = {
      [`green_check:${emojiIds.green_check}`]: {
        name: 'Attending',
        emoji: `<:green_check:${emojiIds.green_check}>`,
        votes: new Set(),
      }
    };

    const roleMentions = {
      kohiwvw: '1251077936899952680',
      openworld: '1178537577003896932'
    };

    const contentChannel = await interaction.guild.channels.fetch('1364930867591516250');
    if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: '❌ Cannot access the content channel or it is not a text channel.' });
    }

    await contentChannel.send(`<@&${roleMentions[selection]}>`);

    const buildEmbed = () => {
      const fields = Object.entries(roles).map(([_, role]) => ({
        name: `${role.name} ${role.emoji}`,
        value: `${role.votes.size} attending\n${[...role.votes].map(id => `<@${id}>`).join('\n') || 'None'}`,
        inline: true
      }));

      return new EmbedBuilder()
        .setColor(statusColors[status])
        .setTitle(`**${title}** | ${timeRange} |⏱️ ${status}`)
        .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
        .setDescription(`<:catmander_cyan:1160045420324597782> <@${interaction.user.id}> — ***Use the thread below to discuss Use the thread below to discuss like special roles etc..***`)
        .addFields(
          { name: 'Event Time (Local)', value: startTimestamp, inline: true },
          { name: 'Starts In', value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: true },
          ...fields
        )
        .setFooter({ text: 'All times shown in your local timezone. Powered by KOHI' });
    };

    const message = await contentChannel.send({ embeds: [buildEmbed()] });

    for (const key of Object.keys(roles)) {
      await message.react(roles[key].emoji).catch(() => {});
    }

    const updateEmbed = async () => {
      await message.edit({ embeds: [buildEmbed()] });
    };

    const collector = message.createReactionCollector({
      filter: (reaction, user) => !user.bot,
      time: endTime - now,
      dispose: true
    });

    collector.on('collect', async (reaction, user) => {
      const emoji = reaction.emoji.identifier;
      const role = roles[emoji];
      if (!role || status !== 'Scheduled') {
        await reaction.users.remove(user.id);
        return user.send(`⚠️ You can't RSVP to **${title}** right now.`).catch(() => {});
      }

      // Ensure user is only in one RSVP group
      for (const [otherKey, otherRole] of Object.entries(roles)) {
        if (otherKey !== emoji && otherRole.votes.has(user.id)) {
          otherRole.votes.delete(user.id);
          const otherReaction = message.reactions.cache.find(r => r.emoji.identifier === otherKey);
          if (otherReaction) await otherReaction.users.remove(user.id);
        }
      }

      role.votes.add(user.id);
      await updateEmbed();
    });

    collector.on('remove', async (reaction, user) => {
      const emoji = reaction.emoji.identifier;
      const role = roles[emoji];
      if (role) {
        role.votes.delete(user.id);
        await updateEmbed();
      }
    });

    await contentChannel.threads.create({
      name: `${title} 📅 ${date} | ⏱️ ${formattedStartTime}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      reason: 'Event discussion thread'
    });

    await interaction.editReply({ content: '✅ Event created successfully!' });

    // Status transitions
    const timeUntilStart = startTime - now;
    const timeUntilEnd = endTime - now;

    setTimeout(() => {
      status = 'In Progress';
      updateEmbed();
    }, timeUntilStart);

    setTimeout(() => {
      status = 'Ended';
      collector.stop();
      updateEmbed();
      message.reactions.removeAll().catch(() => {});
    }, timeUntilEnd);

    // 5-minute reminder
    const reminderTime = startTime.getTime() - 5 * 60 * 1000;
    if (reminderTime > now) {
      setTimeout(() => {
        const allUserIds = new Set();
        for (const role of Object.values(roles)) {
          role.votes.forEach(id => allUserIds.add(id));
        }
        for (const userId of allUserIds) {
          const member = interaction.guild.members.cache.get(userId);
          if (member) {
            member.send(`⏰ Reminder: **${title}** starts in 5 minutes! Get ready!`).catch(() => {});
          }
        }
      }, reminderTime - now);
    }
  }
};
