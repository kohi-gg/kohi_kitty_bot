const { SlashCommandBuilder } = require('discord.js');



module.exports = {
    data: new SlashCommandBuilder()
      .setName('give-advice')
      .setDescription('Replies with random advice'),
    async execute(interaction) {
        
        const m = await fetch('https://api.adviceslip.com/advice');
        const data = await m.json();
        const advice = data.slip.advice;

        await interaction.reply(`__Advice:__ **${advice}**`);
    
   
    },
};