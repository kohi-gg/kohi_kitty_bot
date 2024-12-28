const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require("parse-ms-2");
//Connect to database


// MODELS
const Data = require("../../helper/data");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('get-treats')
    .setDescription('Get your treats for kohi!'),
  async execute(interaction){
    let reward = 5;
    let timeout = 86400000;
    
  let userData = await Data.findOne({userID: interaction.user.id});

        if(!userData){
            let newData = await Data.create({
            name: interaction.user.username,
            userID: interaction.user.id,
            tuna: reward,
            daily: 0,
            })

            newData.save().catch(err => console.log(err));
        let balanceEmbed = new EmbedBuilder()
        .setColor("Random")
        .setTitle(`${interaction.user.username}'s Balance`)
        .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
        .setDescription(`<:tuna:1320596587373658195>  **${userData.tuna}** `)
        interaction.reply({embeds:[balanceEmbed]});
        }
      
        else{
            if(timeout - (Date.now() - userData.daily) > 0){
                let time = ms(timeout - (Date.now() - userData.daily));

                let balanceEmbed = new EmbedBuilder()
                .setColor("Random")
                .setTitle(`${interaction.user.username}'s Balance`)
                .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
                .setDescription(`**You already collected your daily treats! collect again in ${time.hours}H ${time.minutes}m** `)
                interaction.reply({embeds:[balanceEmbed]});
                
            } else{
                userData.tuna +=reward;
                userData.daily = Date.now();
                userData.save().catch(err => console.log(err));
                let balanceEmbed = new EmbedBuilder()
                .setColor("Random")
                .setTitle(`${interaction.user.username}'s Balance`)
                .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
                .setDescription(`<:tuna:1320596587373658195>  **${userData.tuna}** `)
                interaction.reply({embeds:[balanceEmbed]});
                return;

            }
            
                
        }; 

  }};