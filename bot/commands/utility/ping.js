const { SlashCommandBuilder } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
      .setName('ping')
      .setDescription('test ping'),
    async execute(interaction) {
        await interaction.deferReply();
        await interaction.deleteReply();

        const m = await interaction.channel.send("Ping?");
    m.edit(`Pong<:tuna:1320596587373658195> ${m.createdTimestamp - interaction.createdTimestamp}ms`);
    
   
    },
};