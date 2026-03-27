const { SlashCommandBuilder } = require('discord.js');
const Event = require("../../helper/eventdata");
const EventSignup = require("../../helper/eventsignup");

const ROLE_EMOJIS = {
  Tank: "<:heart:1146979167330644019>",
  BoonDPS: "<:alacrity:1149886586369085510>",
  DPS: "<:dps:1149886591922352219>",
  Participants: "👥",
  Fill: "🪑",
};

const EVENT_ROLE = {
  fractal: "1149898453242093608",
  dungeon:"1192031906880049182",
  raid:"1149898360954835044",
  openworld:"1178537577003896932",
  wvw:"1149898698675998741",
  strikes: "1149898797921611887",
  convergence: "1178537577003896932",
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

    if (!eventData) {
      return interaction.editReply({ content: "❌ This thread is not linked to an event." });
    }

    const { hostId, group, channelId, messageId, title, contentType } = eventData;

    if (interaction.user.id !== hostId) {
      return interaction.editReply({ content: "❌ Only the host can remove users from this event." });
    }

    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || "No reason provided";

    const signup = await EventSignup.findOne({
      eventId: eventData._id,
      userId: targetUser.id
    });

    if (!signup) {
      return interaction.editReply({
        content: `⚠️ ${targetUser.tag} is not signed up for this event.`
      });
    }

    const removedRole = signup.role;
    await signup.deleteOne();

    // Fetch message
    const channel = await interaction.client.channels.fetch(channelId);
    const message = await channel.messages.fetch(messageId);

    // Rebuild message
    let messageContent = `**${title.toUpperCase()}**\n`;
    messageContent += `Hosted by: <@${hostId}>\n`;

    if (eventData.isClosed) {
      messageContent += `🚫 This event is CLOSED and no longer accepting signups.\n`;
    } else {
      messageContent += `Use \`/sqjoin\` + role to join | \`/leave\` to leave/change\n`;
    }

    messageContent += `\n`;

    for (const [role, limit] of Object.entries(group)) {
      const users = await EventSignup.find({ eventId: eventData._id, role });

      const mentions = users.map(u => `<@${u.userId}>`).join("\n") || "-";
      const emoji = ROLE_EMOJIS[role] || "";

      messageContent += `${emoji} **${role}** (${users.length}/${limit === Infinity ? "∞" : limit})\n`;
      messageContent += `${mentions}\n\n`;
    }

    // Update message (no re-ping)
    await message.edit({
      content: `<@&${EVENT_ROLE[contentType]}>\n${messageContent}`,
      allowedMentions: { roles: [] }
    });

    // DM removed user
    try {
      await targetUser.send(
        `❌ You have been removed from the event "${title}" by the host.\n**Reason:** ${reason}`
      );
    } catch (err) {
      console.error("Could not DM user:", err);
    }

    await interaction.editReply({
      content: `✅ Removed ${targetUser.tag} from **${removedRole}**.\n**Reason:** ${reason}`
    });
  },
};