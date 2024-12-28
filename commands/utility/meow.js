const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Breed, TheCatAPI } = require("@thatapicompany/thecatapi");
const axios = require('axios');
require('dotenv').config({ path: "./.env" });

const theCatAPI = new TheCatAPI(process.env.CAT_API_KEY);

module.exports = {
    data: new SlashCommandBuilder()
      .setName('meow')
      .setDescription('meow'),
    async execute(interaction) {
        const catImage = await theCatAPI.images.getRandomImage();
        interaction.reply(catImage.url);
    },
};