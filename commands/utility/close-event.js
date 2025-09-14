const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");
const Event = require("../../helper/eventdata");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("close-event")
    .setDescription("Close an event to restrict further signups.")
    .addStringOption(option =>
      option.setName("eventid")
        .setDescription("The thread ID (right click on the embed and click copy ID and paste it here")
        .setRequired(true)
    ),

  async execute(interaction) {
    const eventId = interaction.options.getString("eventid");

    try {
      // Find the event
      const event = await Event.findOne({ threadId: eventId });

      if (!event) {
        return interaction.reply({ content: "❌ Event not found.", ephemeral: true });
      }

      // Check if the user is the host (or allow admins)
      if (event.hostId !== interaction.user.id && 
          !interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: "❌ You don’t have permission to close this event.", ephemeral: true });
      }

      // If already closed
      if (event.isClosed) {
        return interaction.reply({ content: "⚠️ This event is already closed.", ephemeral: true });
      }

      // Close it
      event.isClosed = true;
      await event.save();

      return interaction.reply({ content: `✅ Event **${event.title}** has been closed. No more signups allowed.` });
    } catch (err) {
      console.error(err);
      return interaction.reply({ content: "❌ Something went wrong closing the event.", ephemeral: true });
    }
  }
};
