// commands/music/skip.js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skip')
        .setDescription('Skips the currently playing song.'),
    async execute(interaction) {
        const serverQueue = interaction.client.queues.get(interaction.guild.id);

        if (!serverQueue) {
            return interaction.reply({
                content: 'There is no song that I could skip!',
            })
        }

        if (serverQueue.songs.length <= 1) {
            return interaction.reply({
                content: 'There is no next song to skip to!',
            });
        }

        // Stopping the player will trigger the 'idle' event and play the next song
        serverQueue.player.stop();

        return interaction.reply({
            content: 'Skipped to the next song!',
        });
    },
};