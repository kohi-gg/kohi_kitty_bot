// commands/music/stop.js
const { SlashCommandBuilder, EntryPointCommandHandlerType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stop')
        .setDescription('Stops the music and clears the queue.'),
    async execute(interaction, client) {
        const serverQueue = interaction.client.queues.get(interaction.guild.id);

        if (!serverQueue) {
            return interaction.reply({
                content: 'There is no music playing to stop.',
                ephemeral: true
            })
        }

        serverQueue.songs = [];
        serverQueue.connection.destroy();
        interaction.client.queues.delete(interaction.guild.id);

        return interaction.reply({ content: 'Music stopped and queue cleared.' });
    },
        
};