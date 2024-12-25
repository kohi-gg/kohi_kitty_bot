const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../../helper/db');
const {Model , DataTypes} = require ('sequelize')
//Checks balance(Tuna) from Database
module.exports = {
  data: new SlashCommandBuilder()
  .setName('balance')
  .setDescription('balance'),
async execute(interaction) {
    await interaction.deferReply();
    await interaction.deleteReply();

    const m = await interaction.channel.send("Ping?");
m.edit(`Pong isama ang <:tuna:1320596587373658195> ${m.createdTimestamp - interaction.createdTimestamp}ms`);


},
};