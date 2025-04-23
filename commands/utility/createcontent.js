const {
  SlashCommandBuilder,
  ChannelType,
  ThreadAutoArchiveDuration,
  EmbedBuilder,
  PermissionFlagsBits
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
              .setRequired(true)),

  async execute(interaction) {
      await interaction.deferReply({ ephemeral: true });

      const title = interaction.options.getString('your-content');
      const mentionRole = interaction.options.getRole('mention-roles');
      const contentChannel = await interaction.guild.channels.fetch('1159721580964880414');

      if (!contentChannel || contentChannel.type !== ChannelType.GuildText) {
          return interaction.editReply({ content: 'Content channel is not accessible or not a text channel.' });
      }

      const embed = new EmbedBuilder()
          .setColor(`#${Math.floor(Math.random() * 16777215).toString(16)}`)
          .setTitle(title)
          .setURL('https://www.youtube.com/watch?v=y0sF5xhGreA')
          .setDescription(`**Event hosted by <@${interaction.user.id}>**\nUse the thread below to discuss.`)
          .addFields(
              { name: 'Tank/Boon/Heal (🛡️)', value: 'None', inline: true },
              { name: 'BOONDPS (⏰)', value: 'None', inline: true },
              { name: 'DPS (⚔️)', value: 'None', inline: true }
          )
          .setFooter({text:'powered by KOHI'});

      await contentChannel.send({ content: `${mentionRole}` });
      const message = await contentChannel.send({ embeds: [embed] });

      const votes = {
          '🛡️': new Set(),
          '⏰': new Set(),
          '⚔️': new Set()
      };

      const maxSlots = {
          '🛡️': 2,
          '⏰': 2,
          '⚔️': 6
      };

      for (const emoji of Object.keys(votes)) {
          await message.react(emoji);
      }

      const updateEmbed = async () => {
          const updatedEmbed = EmbedBuilder.from(message.embeds[0]);

          updatedEmbed.spliceFields(0, 3,
              {
                  name: 'Tank/Boon/Heal (🛡️)',
                  value: votes['🛡️'].size > 0 ? [...votes['🛡️']].map(u => `<@${u.id}>`).join('\n') : 'None',
                  inline: true
              },
              {
                  name: 'BOONDPS (⏰)',
                  value: votes['⏰'].size > 0 ? [...votes['⏰']].map(u => `<@${u.id}>`).join('\n') : 'None',
                  inline: true
              },
              {
                  name: 'DPS (⚔️)',
                  value: votes['⚔️'].size > 0 ? [...votes['⚔️']].map(u => `<@${u.id}>`).join('\n') : 'None',
                  inline: true
              }
          );

          await message.edit({ embeds: [updatedEmbed] });
      };

      const collector = message.createReactionCollector({
          filter: (reaction, user) => !user.bot,
          time: 3600_000,
          dispose: true
      });

      collector.on('collect', async (reaction, user) => {
          const emoji = reaction.emoji.name;

          if (!votes[emoji]) {
              await reaction.users.remove(user.id);
              return;
          }

          // If role is full
          if (votes[emoji].size >= maxSlots[emoji]) {
              await reaction.users.remove(user.id);
              try {
                    await user.send(`Sorry! The role for **${emoji}** is already full. Please try another role or wait for an open spot.`);
                  } catch (err) {
                    console.warn(`Couldn't DM ${user.tag}:`, err.message);
                  }
    
              return;
          }

          // Remove user from other roles (one reaction per user)
          for (const e of Object.keys(votes)) {
              if (e !== emoji && votes[e].has(user)) {
                  votes[e].delete(user);
                  const react = message.reactions.cache.get(e);
                  if (react) await react.users.remove(user.id);
              }
          }

          votes[emoji].add(user);
          await updateEmbed();
      });

      collector.on('remove', async (reaction, user) => {
          const emoji = reaction.emoji.name;
          if (votes[emoji]) {
              votes[emoji].delete(user);
              await updateEmbed();
          }
      });

      // Create thread
      await contentChannel.threads.create({
          name: title,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
          reason: 'Content discussion thread'
      });

      await interaction.editReply({ content: 'Content and RSVP embed created!' });
  }
};
