const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const Event = require("../../helper/eventdata");
const EventSignup = require("../../helper/eventsignup");

const ROLE_EMOJIS = {
  Tank: "<:heart:1146979167330644019>",
  BoonDPS: "<:alacrity:1149886586369085510>",
  DPS: "<:dps:1149886591922352219>",
  Participants: "👥",
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leave')
    .setDescription('Leave your signed-up role in this event'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const threadId = interaction.channel.id;
    const eventData = await Event.findOne({ threadId });
    if (!eventData) return interaction.editReply({ content: "❌ This thread is not linked to an event." });

    const { group, channelId, messageId, hostId } = eventData;

    const signup = await EventSignup.findOne({ eventId: eventData._id, userId: interaction.user.id });
    if (!signup) return interaction.editReply({ content: "⚠️ You are not signed up for this event." });

    const userRole = signup.role;
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

    // DM host
    try {
      if (hostId) {
        const host = await interaction.client.users.fetch(hostId);
        await host.send(`${interaction.user.tag} left their **${userRole}** slot in "${eventData.title}".`);
      }
    } catch (err) { console.error(err); }

    await interaction.editReply({ content: `✅ You left your **${userRole}** slot.` });
  },
};
