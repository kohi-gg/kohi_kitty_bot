// commands/music/play.js
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meowsic-play')
        .setDescription('Play a song.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The URL or search term of the song to play.')
                .setRequired(true)),
    async execute(interaction) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;

        // 1. Initial checks
        if (!voiceChannel) {
            return interaction.reply('You need to be in a voice channel to play music!');
        }

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.reply('I need the permissions to join and speak in your voice channel!');
        }

        await interaction.deferReply();

        // 2. Search for the song
        const searchResults = await play.search(query, { limit: 1 });

        if (searchResults.length === 0) {
            return interaction.editReply('No results found for your query.');
        }

        const video = searchResults[0];
        const stream = await play.stream(song.url);

        const song = {
            title: video.title,
            url: video.url,
            duration: video.durationRaw,
            thumbnail: video.thumbnails[0].url,
            requrestedBy: interaction.user.tag,
            stream: stream,
        };

        // 3. Get of Create the Queue
        let serverQueue = interaction.client.queue.get(interaction.guild.id);

        if (!serverQueue) {
            const queueContruct = {
                voiceChannel: voiceChannel,
                connection: null,
                songs: [],
            };

            interaction.client.queue.set(interaction.guild.id, queueContruct);
            serverQueue = interaction.client.queues.get(interaction.guild.id);

            serverQueue.songs.push(song);

            try {
                const connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });
                queueContruct.connection = connection;
                connection.subscribe(serverQueue.player);
                await playSong(interaction.guild.id, interaction.client.queues);
            } catch (err) {
                interaction.client.queue.delete(interaction.guild.id);
                console.error(err);
                return interaction.editReply({
                    content: 'There was an error connecting to the voice channel!',
                });
            }
        } else {
            serverQueue.songs.push(song);
            return interaction.editReply({
                content: `**${song.title}** has been added to the queue!`,
            });
        }

            return interaction.editReply({
                content: `Started playing: **${song.title}**`,
            });
        },

};

// Helper function to play the song and handle the queue
async function playSong(guildId, queues) {
    const serverQueue = queues.get(guildId);
    if (!serverQueue) return;

    if (serverQueue.songs.length === 0) {
        // If queue is empty, leave the channel after a delay
        setTimeout(() => {
            if (serverQueue.songs.length === 0) {
                serverQueue.connection.destroy();
                queues.delete(guildId);
            }
        }, 30000); // 30 seconds
        return;    
    }

    const song = serverQueue.songs[0];
    const resource = createAudioResource(song.stream.stream, { inputType: song.stream.type });
    
    serverQueue.player.play(resource);

    // Event listener for when the song ends
    serverQueue.player.once(AudioPlayerStatus.Idle, () => {
        serverQueue.songs.shift(); // Remove the finished song from the queue
        playSong(guildId, queues); // Play the next song
    });

    serverQueue.player.on('error', error => {
        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
        serverQueue.songs.shift();
        playSong(guildId, queues);
    });
        
}