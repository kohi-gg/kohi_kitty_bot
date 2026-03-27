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
    .setName('leave')
    .setDescription('Leave your signed-up role in this event')
    .addStringOption(option =>
      option.setName("reason")
        .setDescription("Reason for leaving")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const reason = interaction.options.getString("reason");
    const threadId = interaction.channel.id;

    const eventData = await Event.findOne({ threadId });
    if (!eventData) {
      return interaction.editReply({ content: "❌ This thread is not linked to an event." });
    }

    const { group, channelId, messageId, hostId, title, contentType } = eventData;

    const signup = await EventSignup.findOne({
      eventId: eventData._id,
      userId: interaction.user.id
    });

    if (!signup) {
      return interaction.editReply({ content: "⚠️ You are not signed up for this event." });
    }

    const userRole = signup.role;
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

    // Update message (prevent re-ping)
    await message.edit({
      content: `<@&${EVENT_ROLE[contentType]}>\n${messageContent}`,
      allowedMentions: { roles: [] }
    });

    // DM host with reason
    try {
      if (hostId) {
        const host = await interaction.client.users.fetch(hostId);
        const member = await interaction.guild.members.fetch(interaction.user.id);
        const displayName = member.nickname || interaction.user.username;

        await host.send(
          `${displayName} left their **${userRole}** slot in "${title}".\nReason: ${reason}`
        );
      }
    } catch (err) {
      console.error(err);
    }

    await interaction.editReply({
      content: `✅ You left your **${userRole}** slot.\nReason: ${reason}`
    });
  },
};