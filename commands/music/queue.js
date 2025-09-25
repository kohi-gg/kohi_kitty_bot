// commands/music/queue.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Displays the current music queue.'),
    async execute(interaction) {
        const serverQueue = interaction.client.queues.get(interaction.guild.id);

        if (!serverQueue || serverQueue.songs.length === 0) {
            return interaction.reply({
                content: 'The queue is currently empty!',
                ephemeral: true,
            });
        }

        const songList = serverQueue.songs.map((song, index) => {
            return `${index + 1}. **[${song.title}](${song.url})** | \`${song.duration}\` - Requested by ${song.requestedBy}`;
        }).join('\n');

        const queueEmbed = new EmbedBuilder()
            .setColor('#0099ff')
            .setTitle('Current Music Queue')
            .setThumbnail(serverQueue.songs[0].thumbnail)
            .setDescription(`**Now Playing:** [${serverQueue.songs[0].title}](${serverQueue.songs[0].url})\n\n${songList.substring(0, 4000)}`)
            .setTimestamp()
            .setFooter({ text: `Total songs: ${serverQueue.songs.length}` });

        return interaction.reply({ embeds: [queueEmbed] });
    },
};