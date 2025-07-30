const { SlashCommandBuilder } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
      .setName('rock')
      .setDescription('you choose rock'),
    async execute(interaction) {

        const choices = ['paper', 'rock', 'scissors'];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

    
        switch (botChoice) {
          case 'paper':
            response = `https://tenor.com/view/rock-paper-scissors-roshambo-rochambeau-paper-scissors-stone-janken-gif-7360732434909703272`;
            break;
          case 'rock':
            response = `https://tenor.com/view/rock-paper-scissors-roshambo-rochambeau-paper-scissors-stone-janken-gif-11229337051518507180`;
            break;
          case 'scissors':
            response = 'https://tenor.com/view/rock-paper-scissors-roshambo-rochambeau-paper-scissors-stone-janken-gif-4465293968569118260';
            break;
        }
    
        await interaction.reply(response);
    },
};