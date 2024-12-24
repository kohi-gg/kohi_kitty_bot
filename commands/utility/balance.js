const { SlashCommandBuilder } = require('discord.js');
const { storeTuna } = require('../../helper/TunaStore');

module.exports = {
    data: new SlashCommandBuilder()
      .setName('balance')
      .setDescription('Set your Guild Wars 2 Account API key.'),
    async execute(interaction) {
    let userName = interaction.user.username;
    let userID =  interaction.user.id;

    await storeTuna(userName, userID)

    interaction.channel.send(`<:tuna:1320596587373658195> ${money}`);
    },
};