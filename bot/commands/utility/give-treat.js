const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const ms = require("parse-ms-2");
//Connect to database


// MODELS
const Data = require("../../helper/data");

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give-treats')
    .addIntegerOption( option =>(
        option.setName("amount")
        .setDescription('enter amount')
        .setRequired(true)
    ))
    .addUserOption( option =>(
        option.setName("target")
        .setDescription('the someone')
        .setRequired(true)
    ))
    .setDescription('Give your treats for someone!'),
  async execute(interaction){


    const giveTreats = interaction.options.getInteger("amount");
    const giveUser = interaction.options.getUser("target");
    
  let userData = await Data.findOne({userID: giveUser.id});
  let authorData = await Data.findOne({userID: interaction.user.id});
  let giveAmount = giveTreats;
  let givenUser = giveUser.id;

    if(givenUser === interaction.user.id){
        let messageEmbed = new EmbedBuilder()
            .setColor("#1bb369")
            .setTitle(`======================`)
            .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
            .setDescription(`**You can't treat yourself bruh**`)
            interaction.reply({embeds:[messageEmbed]});
            return;
    }

    if(!userData){
        let messageEmbed = new EmbedBuilder()
            .setColor("#1bb369")
            .setTitle(`======================`)
            .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
            .setDescription(`**Sorry couldnt find that user :(**`)
            interaction.reply({embeds:[messageEmbed]});
            return;
    }

    if(!authorData){
        let newData = await Data.create({
        name: interaction.user.username,
        userID: interaction.user.id,
        tuna: 0,
        daily: 0,
        })

        newData.save().catch(err => console.log(err));
        let messageEmbed = new EmbedBuilder()
        .setColor("#1bb369")
        .setTitle(`======================`)
        .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
        .setDescription(`**You don't have enough <:tuna:1320596587373658195> :(**`)
        interaction.reply({embeds:[messageEmbed]});
        return;
    }
      
        else{
            if(parseInt(giveAmount) > authorData.tuna){
                let messageEmbed = new EmbedBuilder()
                .setColor("#1bb369")
                .setTitle(`======================`)
                .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
                .setDescription(`**You don't have enough <:tuna:1320596587373658195> :(**`)
                interaction.reply({embeds:[messageEmbed]});
                return;
            } 

            if(parseInt(giveAmount) < 5){
                let messageEmbed = new EmbedBuilder()
                .setColor("#1bb369")
                .setTitle(`======================`)
                .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
                .setDescription(`**You can't give less than 5**`)
                interaction.reply({embeds:[messageEmbed]});
                return;
            }

            if(!userData){
                let newData = await Data.create({
                name: interaction.user.username,
                userID: interaction.user.id,
                tuna: 0,
                daily: 0,
                })
    
                authorData.tuna -= giveAmount;
                newData.save().catch(err => console.log(err));
                authorData.save().catch(err => console.log(err));
                let messageEmbed = new EmbedBuilder()
                .setColor("#1bb369")
                .setTitle(`======================`)
                .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
                .setDescription(`**You don't have enough <:tuna:1320596587373658195> :(**`)
                interaction.reply({embeds:[messageEmbed]});
                return;
            } else {
                userData.tuna += giveAmount;
                authorData.tuna -= giveAmount;
                userData.save().catch(err => console.log(err));
                authorData.save().catch(err => console.log(err));
                let messageEmbed = new EmbedBuilder()
                .setColor("#1bb369")
                .setTitle(`======================`)
                .setURL("https://www.youtube.com/watch?v=vNhs9CSI0Vc/")
                .setDescription(`**You give ${giveUser} ${giveTreats} <:tuna:1320596587373658195>**`)
                interaction.reply({embeds:[messageEmbed]});
                return;
            }

            
                
        }; 

  }};