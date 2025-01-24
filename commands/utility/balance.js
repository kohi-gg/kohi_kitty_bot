const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const assert = require("assert");
//Connect to database


// MODELS
const Data = require("../../helper/data");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('check your balance'),
  async execute(interaction){
    
    let userData = await Data.findOne({userID: interaction.user.id});

   let botChannel = "1171287223279304784";
    if(interaction.channel.id != '1182574546612666378' && interaction.channel.id != '1159721580964880414')
      {
        
      let MsgEmbed = new EmbedBuilder()
              .setColor("#1bb369")
              .setTitle(`--------------------------------`)
              .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
              .setDescription(`**Sorry, please use <#${botChannel.toString()}> channel.** `)
              interaction.reply({embeds:[MsgEmbed]});
              return;

      }
    
      console.log(interaction.channel.id);
        if(userData){
          await Data.findOneAndUpdate({userID:interaction.user.id},{name:interaction.user.username}).then(function(){
              Data.findOne({userID:interaction.user.id}).then(function(result){
                assert(result.name === interaction.user.username)
                console.log(`User's username (${interaction.user.username}) is updated to DB`)
              })
            }
          )
              let balanceEmbed = new EmbedBuilder()
              .setColor("#1bb369")
              .setTitle(`${interaction.user.username}'s Balance`)
              .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
              .setDescription(`<:tuna:1320596587373658195>  **${userData.tuna}** `)
              interaction.reply({embeds:[balanceEmbed]});
              return;
          }
  
        if(!userData){
          let newData = await Data.create({
            name: interaction.user.username,
            userID: interaction.user.id,
            tuna: 0,
            daily: 0,
          })
  
          newData.save().catch(err => console.log(err));
          let balanceEmbed = new EmbedBuilder()
          .setColor("#1bb369")
          .setTitle(`${interaction.user.username}'s Balance`)
          .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
          .setDescription(`<:tuna:1320596587373658195>  **0** `)
          interaction.reply({embeds:[balanceEmbed]});
          return;
          }

      
  }};