const {
    SlashCommandBuilder,
    ChannelType,
    ThreadAutoArchiveDuration,
    EmbedBuilder
  } = require('discord.js');
  
  module.exports = {
    data: new SlashCommandBuilder()
      .setName('create-fiveman-content')
      .setDescription('Create an event for five-man content')
      .addStringOption(option =>
        option.setName('title')
          .setDescription('Your preferred title for this content')
          .setRequired(true))
      .addStringOption(option =>
        option.setName('selection')
          .setDescription('Choose content for 10-man party')
          .setRequired(true)
          .addChoices(
            { name: 'Fractals', value: 'fractals' },
            { name: 'Dungeon', value: 'dungeon' }
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
        tank: '1146979167330644019',
        boon: '1149886586369085510',
        dps: '1149886591922352219',
        fill: '782478971471265804' // Add your actual emoji ID for "Fills"
      };
  
      const roles = {
        [`heart:${emojiIds.tank}`]: { name: 'Tank/Heal', emoji: `<:heart:${emojiIds.tank}>`, max: 1, votes: new Set() },
        [`alacrity:${emojiIds.boon}`]: { name: 'BoonDPS', emoji: `<:alacrity:${emojiIds.boon}>`, max: 1, votes: new Set() },
        [`dps:${emojiIds.dps}`]: { name: 'DPS', emoji: `<:dps:${emojiIds.dps}>`, max: 3, votes: new Set() },
        [`uwu:${emojiIds.fill}`]: { name: 'Fills', emoji: `<:uwu:${emojiIds.fill}>`, max: 5, votes: new Set() }
      };
  
      const roleMentions = {
        fractals: '1149898453242093608',
        dungeon: '1192031906880049182'
      };
  
      const contentChannel = await interaction.guild.channels.fetch('1159721580964880414');
      if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
        return interaction.editReply({ content: '❌ Cannot access the content channel or it is not a text channel.' });
      }
  
      await contentChannel.send(`<@&${roleMentions[selection]}>`);
  
      const buildEmbed = () => {
        const fields = Object.entries(roles).map(([_, role]) => ({
          name: `${role.name} (${role.emoji})`,
          value: `${role.votes.size}/${role.max}\n${[...role.votes].map(u => `<@${u.id}>`).join('\n') || 'None'}`,
          inline: true
        }));
  
        return new EmbedBuilder()
          .setColor(statusColors[status])
          .setTitle(`**${title}** 📅 ${timeRange} | ⏱️ ${status}`)
          .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
          .setDescription(`<:catmander_cyan:1160045420324597782> /sqjoin <@${interaction.user.id}> use **/sqjoin /join + hostname/commander** to join —  \n Use the thread below to discuss.`)
          .addFields({ name: 'Event Time (Local)', value: startTimestamp }, ...fields)
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
  
        if (role.votes.size >= role.max) {
          await reaction.users.remove(user.id);
          return user.send(`❌ Sorry! The slot for ${role.name} is full.`).catch(() => {});
        }
  
        for (const [otherKey, otherRole] of Object.entries(roles)) {
          if (otherKey !== emoji && otherRole.votes.has(user)) {
            otherRole.votes.delete(user);
            const otherReaction = message.reactions.cache.find(r => r.emoji.identifier === otherKey);
            if (otherReaction) await otherReaction.users.remove(user.id);
          }
        }
  
        role.votes.add(user);
        await updateEmbed();
      });
  
      collector.on('remove', async (reaction, user) => {
        const emoji = reaction.emoji.identifier;
        const role = roles[emoji];
        if (role) {
          role.votes.delete(user);
          await updateEmbed();
        }
      });
  
      await contentChannel.threads.create({
        name: `${title} 📅 ${date} | ⏱️ ${formattedStartTime} | ${status}`,
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
  
      // 5-min reminder
      const reminderTime = startTime.getTime() - 5 * 60 * 1000;
      if (reminderTime > now) {
        setTimeout(() => {
          const allUsers = new Set();
          for (const role of Object.values(roles)) {
            role.votes.forEach(user => allUsers.add(user));
          }
          for (const user of allUsers) {
            user.send(`⏰ Reminder: **${title}** starts in 5 minutes! Get ready!`).catch(() => {});
          }
        }, reminderTime - now);
      }
    }
  };
  