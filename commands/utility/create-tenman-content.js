const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-tenman-content')
    .setDescription('Create an event for ten-man content')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Your preferred title for this content')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('selection')
        .setDescription('Choose content for 10-man party')
        .setRequired(true)
        .addChoices(
          { name: 'Raid', value: 'raid' },
          { name: 'Stikes', value: 'strikes' }
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

    if (isNaN(startTime)) {
      return interaction.editReply({ content: '❌ Invalid date or time format. Use YYYY-MM-DD and HH:MM (24hr).' });
    }

    if (startTime <= Date.now()) {
      return interaction.editReply({ content: '⚠️ The event time must be in the future.' });
    }

    const to12h = date => date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    const startTimestamp = `<t:${Math.floor(startTime / 1000)}:F>`;
    const timeRange = `<t:${Math.floor(startTime / 1000)}:t> – <t:${Math.floor(endTime / 1000)}:t>`;
    const formattedStartTime = to12h(startTime);

    let status = 'Scheduled';
    const statusColors = {
      'Scheduled': 0x57F287,
      'In Progress': 0xFAA61A,
      'Ended': 0xED4245
    };

    const emojiIds = {
      tank: '1146979167330644019',
      boon: '1149886586369085510',
      dps: '1149886591922352219'
    };

    const roleMentions = {
      raid: '1149898360954835044',
      strikes: '1149898797921611887'
    };

    const votes = {
      [`tank:${emojiIds.tank}`]: new Set(),
      [`boon:${emojiIds.boon}`]: new Set(),
      [`dps:${emojiIds.dps}`]: new Set()
    };

    const maxSlots = {
      [`tank:${emojiIds.tank}`]: 2,
      [`boon:${emojiIds.boon}`]: 2,
      [`dps:${emojiIds.dps}`]: 6
    };

    const contentChannel = await interaction.guild.channels.fetch('1364930867591516250');
    if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: '❌ Cannot access the content channel or it is not a text channel.' });
    }

    const roleToMention = roleMentions[selection];
    await contentChannel.send(`<@&${roleToMention}>`);

    const embed = new EmbedBuilder()
      .setColor(statusColors[status])
      .setTitle(`**${title}** 📅 ${timeRange} | ⏱️ ${status}`)
      .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
      .setDescription(`<:catmander_cyan:1160045420324597782> <@${interaction.user.id}> — ***Use the thread below to discuss.***`)
      .addFields(
        { name: 'Event Time (Local)', value: startTimestamp },
        { name: 'Tank/Heal (<:heart:1146979167330644019>)', value: '0/2\nNone', inline: true },
        { name: 'BoonDPS (<:alacrity:1149886586369085510>)', value: '0/2\nNone', inline: true },
        { name: 'DPS (<:dps:1149886591922352219>)', value: '0/6\nNone', inline: true }
      )
      .setFooter({ text: 'All times shown in your local timezone. Powered by KOHI' });

    const message = await contentChannel.send({ embeds: [embed] });

    await Promise.all([
      message.react(`<:tank:${emojiIds.tank}>`),
      message.react(`<:boon:${emojiIds.boon}>`),
      message.react(`<:dps:${emojiIds.dps}>`)
    ]);

    const updateEmbed = async () => {
      const updated = EmbedBuilder.from(message.embeds[0])
        .setColor(statusColors[status])
        .setTitle(`**${title}** 📅 ${timeRange} | ⏱️ ${status}`)
        .spliceFields(1, 3,
          {
            name: 'Tank/Heal (<:tank:1146979167330644019>)',
            value: `${votes[`tank:${emojiIds.tank}`].size}/${maxSlots[`tank:${emojiIds.tank}`]}\n${[...votes[`tank:${emojiIds.tank}`]].map(u => `<@${u.id}>`).join('\n') || 'None'}`,
            inline: true
          },
          {
            name: 'BoonDPS (<:boon:1149886586369085510>)',
            value: `${votes[`boon:${emojiIds.boon}`].size}/${maxSlots[`boon:${emojiIds.boon}`]}\n${[...votes[`boon:${emojiIds.boon}`]].map(u => `<@${u.id}>`).join('\n') || 'None'}`,
            inline: true
          },
          {
            name: 'dps (<:dps:1149886591922352219>)',
            value: `${votes[`dps:${emojiIds.dps}`].size}/${maxSlots[`dps:${emojiIds.dps}`]}\n${[...votes[`dps:${emojiIds.dps}`]].map(u => `<@${u.id}>`).join('\n') || 'None'}`,
            inline: true
          }
        );
      await message.edit({ embeds: [updated] });
    };

    const collector = message.createReactionCollector({
      filter: (reaction, user) => !user.bot,
      time: endTime - Date.now(),
      dispose: true
    });

    collector.on('collect', async (reaction, user) => {
      const emoji = reaction.emoji.identifier;
      if (!votes[emoji]) return reaction.users.remove(user.id);

      if (status !== 'Scheduled') {
        await reaction.users.remove(user.id);
        return user.send(`⚠️ The event **${title}** has already started. Your reaction won't count.`).catch(() => {});
      }

      if (votes[emoji].size >= maxSlots[emoji]) {
        await reaction.users.remove(user.id);
        return user.send(`❌ Sorry! The slot for that role is already full.`).catch(() => {});
      }

      for (const key of Object.keys(votes)) {
        if (key !== emoji && votes[key].has(user)) {
          votes[key].delete(user);
          const otherReaction = message.reactions.cache.find(r => r.emoji.identifier === key);
          if (otherReaction) await otherReaction.users.remove(user.id);
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
      name: `${title} 📅 ${date} | ⏱️ ${formattedStartTime} | ${status}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      reason: 'Event discussion thread'
    });

    await interaction.editReply({ content: '✅ Event created successfully!' });

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
          ...votes[`tank:${emojiIds.tank}`],
          ...votes[`boon:${emojiIds.boon}`],
          ...votes[`dps:${emojiIds.dps}`]
        ]);
        for (const user of allUsers) {
          user.send(`⏰ Reminder: **${title}** starts in 5 minutes! Get ready!`).catch(() => {});
        }
      }, reminderTime - Date.now());
    }
  }
};
