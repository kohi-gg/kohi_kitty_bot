const { SlashCommandBuilder } = require('discord.js');


module.exports = {
    data: new SlashCommandBuilder()
      .setName('addrole')
      .setDescription('test ping'),
    async execute(interaction) {
       // await interaction.deferReply();
      //  await interaction.deleteReply();

    
        const user = interaction.options.get('UserName') || bot.users.cache.get(args[0]);
        const role = interaction.options.get('Role') || bot.users.cache.get(args[0]);
        if(!user) return interaction.channel.send({embed:{color:'a20a28', description:"**Sorry, couldn't find that user.**"}});
    
        if(args[0].toLowerCase() == "LGBT"){
            await member.roles.add(teamRole);
            message.channel.send({embed:{color:'a20a28', description:`**Role Added to ${user}**`}});
            return;
        }
        
   
    },
};