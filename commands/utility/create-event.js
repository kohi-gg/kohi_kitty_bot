const { SlashCommandBuilder, EmbedBuilder, ThreadAutoArchiveDuration } = require('discord.js');
const Event = require("../../helper/eventdata");

const EVENT_ROLE = {
  fractal: "1149898453242093608",
  dungeon:"1192031906880049182",
  raid:"1149898360954835044",
  openworld:"1178537577003896932",
  wvw:"1149898698675998741",
  strikes: "1149898797921611887",
  convergence: "1178537577003896932",
};

const GROUP_FIELDS = {
  five: { Tank: 1, BoonDPS: 1, DPS: 3, Fill: 5 },
  ten: { Tank: 2, BoonDPS: 2, DPS: 6, Fill: 10 },
  tenSubs: {Tank: 10 , BoonDPS: 10, DPS: 30 },
  unlimited: { Participants: Infinity}
};

const EMOJI_ID = {
    Tank: "<:heart:1146979167330644019>",
    BoonDPS: "<:alacrity:1149886586369085510>",
    DPS: "<:dps:1149886591922352219>",
    Participants: "👥" // fallback for unlimited
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('create-event')
    .setDescription('Create an event (Fractals, Dungeon, Raid, Open World, WvW, Strikes, Convergence)')
    .addStringOption(option =>
      option.setName("title")
        .setDescription("Set your title for this content")
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName("content")
        .setDescription("Ex. Fractals | Dungeon | Raid | Open World | WvW | Convergence")
        .setRequired(true)
        .addChoices(
          { name: "Fractals", value: "fractal" },
          { name: "Dungeon", value: "dungeon" },
          { name: "Raid", value: "raid" },
          { name: "Open World", value: "openworld" },
          { name: "WvW", value: "wvw" },
          { name: "Strikes Mission", value: "strikes" },
          { name: "Convergence", value: "convergence"}
        )
    ),

  async execute(interaction) {
    const contentTitle = interaction.options.getString("title");
    const contentType = interaction.options.getString("content");
    const roleID = EVENT_ROLE[contentType];
    const roleMention = `<@&${roleID}>`;

    //checks channel #lfg
    const allowedChannels = [
    "1371750538626207754",
    "1364930867591516250"
    ];

    if (!allowedChannels.includes(interaction.channel.id)) {

      let MsgEmbed = new EmbedBuilder()
      .setColor("#c47cca")
      .setTitle(`Please use <#${'1371750538626207754'}> channel thanks!`);

    await interaction.reply({ embeds: [MsgEmbed], ephemeral: true });
    return;
    }

    // group type
    let group;
    if (["fractal", "dungeon"].includes(contentType)) {
      group = GROUP_FIELDS.five;
    } else if (["raid", "strikes"].includes(contentType)) {
      group = GROUP_FIELDS.ten;
    } else if(["convergence"].includes(contentType)){
      group = GROUP_FIELDS.tenSubs;
    } else {
      group = GROUP_FIELDS.unlimited;
    }

    // initialize signup counts
    const signupCounts = {};
    for (const role in group) signupCounts[role] = 0;

    const embed = new EmbedBuilder()
      .setColor("#c47cca")
      .setTitle(contentTitle.toUpperCase())
      .setDescription(`Hosted by: <@${interaction.user.id}> Use \`/sqjoin\` + role to join! \`/leave\` to change role or fully leave`)
      .addFields(
        Object.entries(group).map(([role, limit]) => ({
        name: `${EMOJI_ID[role] || ""} ${role} (${0}/${limit === Infinity ? "∞" : limit})`,
        value: "-",
        inline: true,
        }))
        );

    // send event message
    const eventMessage = await interaction.reply({
      content: roleMention,
      embeds: [embed],
      allowedMentions: { roles: [roleID] },
      fetchReply: true
    });

    // create signup thread
    const thread = await eventMessage.startThread({
      name: `${contentTitle}-signups`,
      autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
    });

    // save to MongoDB
    const newEvent = new Event({
      threadId: thread.id,
      channelId: eventMessage.channel.id,
      messageId: eventMessage.id,
      hostId: interaction.user.id,
      title: contentTitle,
      contentType,
      signupCounts,
      signups: {},
      group
    });

    await newEvent.save();

    await thread.send(`This is the signup thread for **${contentTitle}**. Use \`/sqjoin\` + role to join! \`/leave\` to change role or fully leave. For host you can remove any user type \`/remove-user\` + name and reason (required) \`note: only host can close this event, type /close-event to close this event.\``);
  },
};
