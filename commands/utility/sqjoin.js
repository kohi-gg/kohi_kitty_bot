const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Event = require("../../helper/eventdata");
const EventSignup = require("../../helper/eventsignup");

const ROLE_EMOJIS = {
  Tank: "<:heart:1146979167330644019>",
  BoonDPS: "<:alacrity:1149886586369085510>",
  DPS: "<:dps:1149886591922352219>",
  Participants: "👥",
  Fill: "🪑",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sqjoin')
    .setDescription('Join an event with your chosen role')
    .addStringOption(option =>
      option.setName("role")
        .setDescription("Choose your role")
        .setRequired(true)
        .addChoices(
          { name: "Tank", value: "Tank" },
          { name: "BoonDPS", value: "BoonDPS" },
          { name: "DPS", value: "DPS" },
          { name: "Participants", value: "Participants" },
          { name: "Fill", value: "Fill" },
        )
    )
    .addUserOption(option =>
      option.setName("other")
        .setDescription("Optionally sign up another member")
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const roleChoice = interaction.options.getString("role");
    const targetUser = interaction.options.getUser("other") || interaction.user;
    const threadId = interaction.channel.id;

    const eventData = await Event.findOne({ threadId });
    if (!eventData) return interaction.editReply({ content: "❌ This thread is not linked to an event." });

    if (eventData.isClosed) {
      return interaction.editReply({ content: "This event has been closed and is no longer accepting new signups." });
    }

    const { group, channelId, messageId, hostId } = eventData;

    if (!(roleChoice in group)) return interaction.editReply({ content: `❌ ${roleChoice} is not valid for this event.` });

    // Check if already signed up
    const existing = await EventSignup.findOne({ eventId: eventData._id, userId: targetUser.id });
    if (existing) {
      return interaction.editReply({ content: `⚠️ ${targetUser.id === interaction.user.id ? "You are" : `<@${targetUser.id}> is`} already signed up as **${existing.role}**.` });
    }

    // Check role limit
    const count = await EventSignup.countDocuments({ eventId: eventData._id, role: roleChoice });
    if (group[roleChoice] !== Infinity && count >= group[roleChoice]) {
      return interaction.editReply({ content: `❌ The **${roleChoice}** slots are full.` });
    }

    // Create signup
    await EventSignup.create({ eventId: eventData._id, userId: targetUser.id, role: roleChoice });

    // Rebuild embed
    const channel = await interaction.client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);
    const embed = EmbedBuilder.from(message.embeds[0]);

    const rolesWithCounts = {};
    for (const role in group) {
      const users = await EventSignup.find({ eventId: eventData._id, role });
      rolesWithCounts[role] = users;
    }

    embed.setFields(
      Object.entries(group).map(([role, limit]) => {
        const users = (rolesWithCounts[role] || []).map(u => `<@${u.userId}>`).join("\n") || "-";
        const emoji = ROLE_EMOJIS[role] || "";
        return {
          name: `${emoji} ${role} (${rolesWithCounts[role].length}/${limit === Infinity ? "∞" : limit})`,
          value: users,
          inline: true,
        };
      })
    );

    await message.edit({ embeds: [embed] });

    // DM host
    try {
      if (hostId) {
        const host = await interaction.client.users.fetch(hostId);
        const member = await interaction.guild.members.fetch(targetUser.id);
        const displayName = member.nickname || targetUser.username;

        const signer = (targetUser.id === interaction.user.id)
          ? `${displayName}`
          : `${interaction.user.username} signed up ${displayName}`;

        await host.send(`${signer} as **${roleChoice}** in "${eventData.title}".`);
      }
    } catch (err) { console.error(err); }

    await interaction.editReply({ 
      content: `✅ ${targetUser.id === interaction.user.id ? "You signed up" : `<@${targetUser.id}> was signed up`} as **${roleChoice}**`
    });
  },
};
