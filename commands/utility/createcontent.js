const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-content')
    .setDescription('Create an event thread with a title and mention role')
    .addStringOption(option =>
      option.setName('your-content')
        .setDescription('Title of the event (e.g. RAID WING, FRACTALS, etc.)')
        .setRequired(true))
    .addRoleOption(option =>
      option.setName('mention-roles')
        .setDescription('Mention roles like @Raids, @Fractals')
        .setRequired(true))
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

    const title = interaction.options.getString('your-content');
    const mentionRole = interaction.options.getRole('mention-roles');
    const date = interaction.options.getString('event-date');
    const time = interaction.options.getString('event-time');
    const duration = interaction.options.getInteger('duration');

    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * 60000);

    if (isNaN(startTime.getTime())) {
      return interaction.editReply({ content: '❌ Invalid date or time format. Use YYYY-MM-DD and HH:MM (24hr).' });
    }

    if (startTime.getTime() <= Date.now()) {
      return interaction.editReply({ content: '⚠️ The event time must be in the future. Please input a future date and time.' });
    }

    const formatTime12h = (date) => date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const formattedStartTime = formatTime12h(startTime);
    const formattedEndTime = formatTime12h(endTime);
    const timeRangeLocal = `<t:${Math.floor(startTime.getTime() / 1000)}:t> – <t:${Math.floor(endTime.getTime() / 1000)}:t>`;
    const fullStartTimestamp = `<t:${Math.floor(startTime.getTime() / 1000)}:F>`;

    let status = 'Scheduled';
    const statusColors = {
      'Scheduled': 0x57F287,
      'In Progress': 0xFAA61A,
      'Ended': 0xED4245
    };

    const emojiIds = {
      heart: '1146979167330644019',
      alacrity: '1149886586369085510',
      dps: '1149886591922352219'
    };

    const votes = {
      [`heart:${emojiIds.heart}`]: new Set(),
      [`alacrity:${emojiIds.alacrity}`]: new Set(),
      [`dps:${emojiIds.dps}`]: new Set()
    };

    const maxSlots = {
      [`heart:${emojiIds.heart}`]: 2,
      [`alacrity:${emojiIds.alacrity}`]: 2,
      [`dps:${emojiIds.dps}`]: 6
    };

    const contentChannel = await interaction.guild.channels.fetch('1364930867591516250');
    if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: 'Content channel is not accessible or not a text channel.' });
    }

    const embed = new EmbedBuilder()
      .setColor(statusColors[status])
      .setTitle(`**${title}**  📅 ${timeRangeLocal} | ⏱️ ${status}`)
      .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
      .setDescription(`<:catmander_cyan:1160045420324597782> <@${interaction.user.id}> ***Use the thread below to discuss.***`)
      .addFields(
        { name: 'Event Time (Local)', value: `${fullStartTimestamp}`, inline: false },
        { name: 'Tank/Boon/Heal (<:heart:1146979167330644019>)', value: 'None', inline: true },
        { name: 'BOONDPS (<:alacrity:1149886586369085510>)', value: 'None', inline: true },
        { name: 'DPS (<:dps:1149886591922352219>)', value: 'None', inline: true }
      )
      .setFooter({ text: 'All times shown in your local timezone. Powered by KOHI' });

    await contentChannel.send({ content: `${mentionRole}` });
    const message = await contentChannel.send({ embeds: [embed] });

    await message.react(`<:heart:${emojiIds.heart}>`);
    await message.react(`<:alacrity:${emojiIds.alacrity}>`);
    await message.react(`<:dps:${emojiIds.dps}>`);

    const updateEmbed = async () => {
      const updatedEmbed = EmbedBuilder.from(message.embeds[0])
        .setTitle(`**${title}**  📅 ${timeRangeLocal} | ⏱️ ${status}`)
        .setColor(statusColors[status])
        .spliceFields(1, 3,
          { name: 'Tank/Heal (<:heart:1146979167330644019>)', value: votes[`heart:${emojiIds.heart}`].size ? [...votes[`heart:${emojiIds.heart}`]].map(u => `<@${u.id}>`).join('\n') : 'None', inline: true },
          { name: 'BOONDPS (<:alacrity:1149886586369085510>)', value: votes[`alacrity:${emojiIds.alacrity}`].size ? [...votes[`alacrity:${emojiIds.alacrity}`]].map(u => `<@${u.id}>`).join('\n') : 'None', inline: true },
          { name: 'DPS (<:dps:1149886591922352219>)', value: votes[`dps:${emojiIds.dps}`].size ? [...votes[`dps:${emojiIds.dps}`]].map(u => `<@${u.id}>`).join('\n') : 'None', inline: true }
        );
      await message.edit({ embeds: [updatedEmbed] });
    };

    const collector = message.createReactionCollector({
      filter: (reaction, user) => !user.bot,
      time: endTime - Date.now(),
      dispose: true
    });

    collector.on('collect', async (reaction, user) => {
      const emoji = reaction.emoji.identifier;
      if (!votes[emoji]) return reaction.users.remove(user.id);

      if (status === 'In Progress') {
        await reaction.users.remove(user.id);
        return user.send(`⚠️ The event **${title}** is already in progress. Your reaction won’t count.`).catch(() => {});
      }

      if (votes[emoji].size >= maxSlots[emoji]) {
        await reaction.users.remove(user.id);
        return user.send(`Sorry! The role for **${emoji}** is already full.`).catch(() => {});
      }

      for (const e of Object.keys(votes)) {
        if (e !== emoji && votes[e].has(user)) {
          votes[e].delete(user);
          const react = message.reactions.cache.find(r => r.emoji.identifier === e);
          if (react) await react.users.remove(user.id);
        }
      }

      votes[emoji].add(user);
      await updateEmbed();
    });

    collector.on('remove', async (reaction, user) => {
      const emoji = reaction.emoji.identifier;
      if (votes[emoji]) {
        votes[emoji].delete(user);
        await updateEmbed();
      }
    });

    await contentChannel.threads.create({
      name: `${title}  📅 ${date} | ⏱️ ${formattedStartTime} | ${status}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      reason: 'Content discussion thread'
    });

    await interaction.editReply({ content: '✅ Content and RSVP embed created!' });

    setTimeout(() => {
      status = 'In Progress';
      updateEmbed();
    }, startTime - Date.now());

    setTimeout(() => {
      status = 'Ended';
      collector.stop();
      updateEmbed();
      message.reactions.removeAll().catch(() => {});
    }, endTime - Date.now());

    const reminderTime = startTime.getTime() - 5 * 60 * 1000;
    if (reminderTime > Date.now()) {
      setTimeout(() => {
        const allUsers = new Set([
          ...votes[`heart:${emojiIds.heart}`],
          ...votes[`alacrity:${emojiIds.alacrity}`],
          ...votes[`dps:${emojiIds.dps}`]
        ]);
        for (const user of allUsers) {
          user.send(`<:alacrity:${emojiIds.alacrity}>  Reminder: **${title}** starts in 5 minutes! Get ready!`).catch(() => {});
        }
      }, reminderTime - Date.now());
    }
  }
};
