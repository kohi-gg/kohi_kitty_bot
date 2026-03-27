const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
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
    .setName("close-event")
    .setDescription("Close the current event to restrict further signups."),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const threadId = interaction.channel.id;
    const eventData = await Event.findOne({ threadId });

    if (!eventData) {
      return interaction.editReply({ content: "❌ This thread is not linked to an event." });
    }

    // Check host/admin
    if (
      eventData.hostId !== interaction.user.id &&
      !interaction.member.permissions.has(PermissionFlagsBits.Administrator)
    ) {
      return interaction.editReply({ content: "❌ You don’t have permission to close this event." });
    }

    if (eventData.isClosed) {
      return interaction.editReply({ content: "⚠️ This event is already closed." });
    }

    // Close event
    eventData.isClosed = true;
    await eventData.save();

    try {
      const channel = await interaction.client.channels.fetch(eventData.channelId);
      const message = await channel.messages.fetch(eventData.messageId);

      const { group, hostId, title, contentType } = eventData;

      // rebuild message content (same format as sqjoin)
      let messageContent = `❌ **[CLOSED] ${title.toUpperCase()}**\n`;
      messageContent += `Hosted by: <@${hostId}>\n`;
      messageContent += `🚫 This event is CLOSED and no longer accepting signups.\n\n`;

      for (const [role, limit] of Object.entries(group)) {
        const users = await EventSignup.find({ eventId: eventData._id, role });

        const mentions = users.map(u => `<@${u.userId}>`).join("\n") || "-";
        const emoji = ROLE_EMOJIS[role] || "";

        messageContent += `${emoji} **${role}** (${users.length}/${limit === Infinity ? "∞" : limit})\n`;
        messageContent += `${mentions}\n\n`;
      }

      // preserve role mention without re-pinging
      const EVENT_ROLE = {
        fractal: "1149898453242093608",
        dungeon:"1192031906880049182",
        raid:"1149898360954835044",
        openworld:"1178537577003896932",
        wvw:"1149898698675998741",
        strikes: "1149898797921611887",
        convergence: "1178537577003896932",
      };

      await message.edit({
        content: `<@&${EVENT_ROLE[contentType]}>\n${messageContent}`,
        allowedMentions: { roles: [] }
      });

      // Rename thread
      const thread = await interaction.guild.channels.fetch(threadId);
      if (thread && thread.isThread() && !thread.name.startsWith("[CLOSED]")) {
        await thread.setName(`[CLOSED] ${thread.name}`);
      }

    } catch (err) {
      console.warn("Could not update event message or thread name:", err);
    }

    await interaction.editReply({
      content: `✅ Event **${eventData.title}** has been closed.`
    });
  }
};