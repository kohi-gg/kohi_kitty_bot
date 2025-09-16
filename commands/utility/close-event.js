const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const Event = require("../../helper/eventdata");

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
    if (eventData.hostId !== interaction.user.id &&
        !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return interaction.editReply({ content: "❌ You don’t have permission to close this event." });
    }

    if (eventData.isClosed) {
      return interaction.editReply({ content: "⚠️ This event is already closed." });
    }

    // Close event
    eventData.isClosed = true;
    await eventData.save();

    try {
      // Update embed
      const channel = await interaction.client.channels.fetch(eventData.channelId);
      const message = await channel.messages.fetch(eventData.messageId);
      const embed = EmbedBuilder.from(message.embeds[0]);

      embed.setColor("Red");
      embed.setFooter({ text: "❌ This event is now CLOSED and no longer accepting signups." });
      embed.setTitle(`[CLOSED] ${eventData.title}`);

      await message.edit({ embeds: [embed] });

      // Rename thread
      const thread = await interaction.guild.channels.fetch(threadId);
      if (thread && thread.isThread() && !thread.name.startsWith("[CLOSED]")) {
        await thread.setName(`[CLOSED] ${thread.name}`);
      }
    } catch (err) {
      console.warn("Could not update event embed or thread name:", err);
    }

    await interaction.editReply({ content: `✅ Event **${eventData.title}** has been closed.` });
  }
};
