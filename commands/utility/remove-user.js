const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
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
    .setName('remove-user')
    .setDescription('Remove a user from your event (host only)')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('User to remove')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Optional reason for removal')
        .setRequired(false)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const threadId = interaction.channel.id;
    const eventData = await Event.findOne({ threadId });
    if (!eventData) return interaction.editReply({ content: "❌ This thread is not linked to an event." });

    const { hostId, group, channelId, messageId, title } = eventData;

    if (interaction.user.id !== hostId) {
      return interaction.editReply({ content: "❌ Only the host can remove users from this event." });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    const signup = await EventSignup.findOne({ eventId: eventData._id, userId: targetUser.id });
    if (!signup) {
      return interaction.editReply({ content: `⚠️ ${targetUser.tag} is not signed up for this event.` });
    }

    const removedRole = signup.role;
    await signup.deleteOne();

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

    // DM removed user
    try {
      await targetUser.send(`❌ You have been removed from the event "${title}" by the host.\n**Reason:** ${reason}`);
    } catch (err) {
      console.error("Could not DM user:", err);
    }

    await interaction.editReply({ content: `✅ Removed ${targetUser.tag} from **${removedRole}**.\n**Reason:** ${reason}` });
  },
};
