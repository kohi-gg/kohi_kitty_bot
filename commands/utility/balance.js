const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../../helper/db');
const {Model , DataTypes} = require ('sequelize')
//Checks balance(Tuna) from Database
module.exports = {
    data: new SlashCommandBuilder()
      .setName('balance')
      .setDescription('check your balance'),
    async execute(interaction){
      let userName = interaction.user.username;
      let userID = interaction.user.id;
    const user =  await pool.query('SELECT * FROM tuna  WHERE userID = $1 ',[userID]);
  
  if(!user)
    {
    
    let money = 0;
    let daily = 0;
    await pool.query('INSERT INTO tuna (userName, userID, money, daily) VALUES ($1, $2, $3, $4)',
      [userName, userID, money, daily])
      console.log(`added to tuna table ${userName} ${userID} ${money}`);
      let balanceEmbed = new EmbedBuilder()
      .setColor("Random")
      .setTitle(`${userName}'s Balance`)
      .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
      .setDescription(`<:tuna:1320596587373658195>  **${money.rows}** `)

    interaction.reply({embeds:[balanceEmbed]});
    }else {
      let balanceEmbed = new EmbedBuilder()
      .setColor("Random")
      .setTitle(`${userName}'s Balance`)
      .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
      .setDescription(`<:tuna:1320596587373658195>  **${money.rows}** `)

    interaction.reply({embeds:[balanceEmbed]});

    }
  },
};