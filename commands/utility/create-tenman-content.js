const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder
} = require('discord.js');

// Utility functions
const isValidDateFormat = date => /^\d{4}-\d{2}-\d{2}$/.test(date);
const isValidTimeFormat = time => /^\d{2}:\d{2}$/.test(time);
const to12HourTime = date => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const getAllSignedUserIds = (roles) => {
  const ids = new Set();
  for (const role of Object.values(roles)) {
    for (const user of role.votes) ids.add(user.id || user); // Handles both user objects and IDs
  }
  return ids;
};

const setStatus = async (newStatus, updateEmbed) => {
  status = newStatus;
  await updateEmbed();
};

const getEmojiKey = (emoji) => `${emoji.name}:${emoji.id}`;

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
          { name: 'Strikes', value: 'strikes' }
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

    if (!isValidDateFormat(date) || !isValidTimeFormat(time)) {
      return interaction.editReply({ content: '❌ Invalid date or time format. Use YYYY-MM-DD and HH:MM (24hr).' });
    }

    const MS_IN_MIN = 60000;
    const startTime = new Date(`${date}T${time}:00`);
    const endTime = new Date(startTime.getTime() + duration * MS_IN_MIN);
    const now = Date.now();

    if (isNaN(startTime) || startTime <= now) {
      return interaction.editReply({ content: '⚠️ The event time must be in the future.' });
    }

    const startTimestamp = `<t:${Math.floor(startTime / 1000)}:F>`;
    const timeRange = `<t:${Math.floor(startTime / 1000)}:t> – <t:${Math.floor(endTime / 1000)}:t>`;
    const formattedStartTime = to12HourTime(startTime);

    let status = 'Scheduled';
    const statusColors = {
      'Scheduled': 0x57F287,
      'In Progress': 0xFAA61A,
      'Ended': 0xED4245,
      'Canceled': 0x808080
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

    const roleMentions = {
      raid: '1149898360954835044',
      strikes: '1149898797921611887'
    };

    const contentChannel = await interaction.guild.channels.fetch('1364930867591516250');
    if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
      return interaction.editReply({ content: '❌ Cannot access the content channel or it is not a text channel.' });
    }

    await contentChannel.send(`<@&${roleMentions[selection]}>`);

    const buildEmbed = () => {
      const roleFields = Object.values(roles).map(role => ({
        name: `${role.name} ${role.emoji}`,
        value: `${role.votes.size}/${role.max}\n${[...role.votes].map(u => `<@${u.id}>`).join('\n') || 'None'}`,
        inline: true
      }));

      return new EmbedBuilder()
        .setColor(statusColors[status])
        .setTitle(`**${title}** | ${timeRange} |⏱️ ${status}`)
        .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
        .setDescription(`<:catmander_cyan:1160045420324597782><@${interaction.user.id}> use **/sqjoin /join + hostname/commander** to join —  \n Use the thread below to discussion like special roles etc..`)
        .addFields(
          { name: 'Event Time (Local)', value: startTimestamp },
          { name: 'Starts In', value: `<t:${Math.floor(startTime / 1000)}:R>`, inline: true },
          ...roleFields
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
      const emojiKey = getEmojiKey(reaction.emoji);
      const role = roles[emojiKey];
      if (!role || status !== 'Scheduled') {
        await reaction.users.remove(user.id);
        return user.send(`⚠️ You can't sign up to **${shortId} | ${title}** right now.`).catch(() => {});
      }

      if (role.votes.size >= role.max) {
        await reaction.users.remove(user.id);
        return user.send(`❌ Sorry! The slot for ${role.name} is full.`).catch(() => {});
      }

      for (const [otherKey, otherRole] of Object.entries(roles)) {
        if (otherKey !== emojiKey && otherRole.votes.has(user)) {
          otherRole.votes.delete(user);
          const otherReaction = message.reactions.cache.find(r => getEmojiKey(r.emoji) === otherKey);
          if (otherReaction) await otherReaction.users.remove(user.id);
        }
      }

      role.votes.add(user);
      await updateEmbed();
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

    const thread = await contentChannel.threads.create({
      name: `${shortId} | ${title.slice(0, 50)} 📅 ${date}|⏱️ ${formattedStartTime}`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
      reason: 'Event discussion thread'
    });

    const jumpMsg = await thread.send(`📌 [Event Details - click this to show the event embed](https://discord.com/channels/${interaction.guild.id}/${message.channel.id}/${message.id})`);
    await jumpMsg.pin().catch(() => {});

    await interaction.editReply({ content: '✅ Event created successfully!' });

    // Status transitions
    const timeUntilStart = startTime - now;
    const timeUntilEnd = endTime - now;

    setTimeout(() => {
      if (status !== 'Canceled') { // Only update to "In Progress" if the event isn't canceled
        status = 'In Progress';
        updateEmbed();
      }
    }, timeUntilStart);

    setTimeout(() => {
      if (status !== 'Canceled') { // Only update to "Ended" if the event isn't canceled
        status = 'Ended';
        collector.stop();
        updateEmbed();
        message.reactions.removeAll().catch(() => {});
      }
    }, timeUntilEnd);

   // 5-minute reminder
   const reminderTime = startTime.getTime() - 10 * 60 * 1000;
   if (reminderTime > now) {
     setTimeout(() => {
       const allUserIds = getAllSignedUserIds(roles);
       for (const userId of allUserIds) {
         const member = interaction.guild.members.cache.get(userId);
         if (member) {
           member.send(`⏰ Reminder: **${shortId} | ${title}** starts in 10 minutes! Get ready!`).catch(() => {});
         }
       }
     }, reminderTime - now);
   }

   // Auto-cancel 5 minutes before start if fewer than 7 users RSVP
   const cancelTime = startTime.getTime() - 5 * 60 * 1000;
   if (cancelTime > now) {
     setTimeout(async () => {
       const allUserIds = getAllSignedUserIds(roles);
   
       if (allUserIds.size >= 7 || status !== 'Scheduled') return; // Enough users or already started
   
       // Send DM to event creator
       try {
         const dm = await interaction.user.send({
           content: `⚠️ Only **${allUserIds.size}** users have signed up to **${shortId} | ${title}**. Do you still want to run this event?`,
           components: [{
             type: 1,
             components: [
               {
                 type: 2,
                 label: '✅ Continue Event',
                 style: 3,
                 custom_id: 'continue_event'
               },
               {
                 type: 2,
                 label: '❌ Cancel Event',
                 style: 4,
                 custom_id: 'cancel_event'
               }
             ]
           }]
         });
   
         const dmCollector = dm.createMessageComponentCollector({ time: 2 * 60 * 1000, max: 1 });
   
         dmCollector.on('collect', async (btn) => {
           if (btn.customId === 'continue_event') {
             await btn.reply({ content: '👍 The event will proceed!', ephemeral: true });
           } else if (btn.customId === 'cancel_event') {
             await setStatus('Canceled', updateEmbed);
             await btn.reply({ content: '❌ The event has been canceled. ', ephemeral: true });
   
             for (const userId of allUserIds) {
               try {
                 const user = await interaction.client.users.fetch(userId);
                 await user.send(`❌ The event **${shortId} | ${title}** has been canceled by the host.`);
               } catch {}
             }
   
             collector.stop();
             message.reactions.removeAll().catch(() => {});
           }
         });
   
         dmCollector.on('end', async collected => {
           if (collected.size === 0 && status === 'Scheduled') {
             await setStatus('Canceled', updateEmbed);
   
             for (const userId of allUserIds) {
               try {
                 const user = await interaction.client.users.fetch(userId);
                 await user.send(`❌ The event **${shortId} | ${title}** was canceled due to low signups and no host response.`);
               } catch {}
             }
   
             collector.stop();
             message.reactions.removeAll().catch(() => {});
           }
         });
       } catch (err) {
         console.log(`❌ Failed to DM host:`, err);
       }
     }, cancelTime - now);
   }    
 }
};
