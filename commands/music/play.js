// commands/music/play.js
const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require('@discordjs/voice');
const play = require('play-dl');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meowsic-play')
        .setDescription('Play a song from Youtube, Spotify, or SoundCloud.')
        .addStringOption(option =>
            option.setName('query')
                .setDescription('The URL or search term of the song to play.')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('source')
                .setDescription('Force the search on a specific platform.')
                .setRequired(false)
                .addChoices(
                    { name: 'YouTube', value: 'youtube' },
                    { name: 'Spotify', value: 'spotify' },
                    { name: 'SoundCloud', value: 'soundcloud' },
                )),

    async execute(interaction) {
        const query = interaction.options.getString('query');
        const voiceChannel = interaction.member.voice.channel;
        const source = interaction.options.getString('source');

        // 1. Initial checks
        if (!voiceChannel) {
            return interaction.reply('You need to be in a voice channel to play music!');
        }

        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.reply('I need the permissions to join and speak in your voice channel!');
        }

        await interaction.deferReply();

        // Validate query type
        const sourceType = await play.validate(query);

        if (!sourceType) {
            return interaction.editReply({
                content: "Could not find anything for that query. Try using a valid URL or title."
            });
        }

        let songs = [];
        let replyMessage = "";

        // Logic for Forced Search (if 'source' is provided)
        if (source) {
            const searchOptions = { limit: 1, source: {} };
            searchOptions.source[source] = source === 'youtube' ? 'video' : 'track';

            const searchResult = await play.search(query, searchOptions);
            if (searchResult.length === 0) {
                return interaction.editReply({
                    content: `❌ I couldn't find any results for "${query}" on ${source}.`
                });
            }

            const video = searchResult[0];
            console.log(video);
            songs.push({
                title: video.title,
                url: video.url,
                duration: video.durationRaw,
                thumbnail: video.thumbnails[0].url,
                requestedBy: interaction.user.tag,
            });
            replyMessage = `👍 **${songs[0].title}** has been added to the queue!`;
        } else {
                        // 3. Logic for Automatic Detection (if no 'source' is provided)
            const sourceType = await play.validate(query);

            if (sourceType === 'yt_video' || sourceType === 'sp_track' || sourceType === 'am_track' || sourceType === 'so_track') {
                const videoInfo = await play.search(query, { limit: 1 });
                const video = videoInfo[0];
                console.log(video);
                songs.push({
                    title: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    thumbnail: video.thumbnails[0].url,
                    requestedBy: interaction.user.tag,
                });
                replyMessage = `👍 **${songs[0].title}** has been added to the queue!`;

            } else if (sourceType === 'yt_playlist' || sourceType === 'sp_playlist' || sourceType === 'sp_album' || sourceType === 'am_playlist' || sourceType === 'am_album') {
                const playlist = await play.playlist_info(query, { incomplete: true });
                const videos = await playlist.all_videos();
                for (const video of videos) {
                    songs.push({
                        title: video.title,
                        url: video.url,
                        duration: video.durationRaw,
                        thumbnail: video.thumbnails[0].url,
                        requestedBy: interaction.user.tag,
                    });
                }
                replyMessage = `✅ Added **${songs.length}** songs from the playlist/album to the queue!`;
            
            } else { // Fallback to a default search if it's not a recognized URL
                const searchResult = await play.search(query, { limit: 1 });
                if (searchResult.length === 0) {
                    return interaction.editReply({ content: `❌ I couldn't find any results for "${query}".` });
                }
                const video = searchResult[0];
                console.log(video);
                songs.push({
                    title: video.title,
                    url: video.url,
                    duration: video.durationRaw,
                    thumbnail: video.thumbnails[0].url,
                    requestedBy: interaction.user.tag,
                });
                replyMessage = `👍 **${songs[0].title}** has been added to the queue!`;
            }
        }

               if (songs.length === 0) {
            return interaction.editReply({ content: "❌ I couldn't find what you were looking for. Please try again." });
        }

        // 4. Handle the queue and connection
        await handleQueue(interaction, songs, replyMessage);
    },
};

// --- Helper Functions ---

async function handleQueue(interaction, songs, replyMessage) {
    const serverQueue = interaction.client.queues.get(interaction.guild.id);

    if (!serverQueue) {
        const queueContract = {
            voiceChannel: interaction.member.voice.channel,
            connection: null,
            player: createAudioPlayer(),
            songs: songs,
        };
        interaction.client.queues.set(interaction.guild.id, queueContract);

        try {
            const connection = joinVoiceChannel({
                channelId: interaction.member.voice.channel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
            queueContract.connection = connection;
            connection.subscribe(queueContract.player);
            await interaction.editReply(replyMessage);
            playSong(interaction.guild.id, interaction.client.queues);
        } catch (err) {
            interaction.client.queues.delete(interaction.guild.id);
            console.error(err);
            await interaction.editReply({ content: 'I could not join the voice channel.' });
        }
    } else {
        serverQueue.songs = serverQueue.songs.concat(songs);
        await interaction.editReply(replyMessage);
    }
}

async function playSong(guildId, queues) {
    const serverQueue = queues.get(guildId);
    if (!serverQueue) return;

    if (serverQueue.songs.length === 0) {
        setTimeout(() => {
            if (queues.has(guildId) && queues.get(guildId).songs.length === 0) {
                queues.get(guildId).connection.destroy();
                queues.delete(guildId);
            }
        }, 300000); // Disconnect after 5 minutes of inactivity
        return;
    }

    const song = serverQueue.songs[0];
    try {
        const stream = await play.stream(song.url);
        const resource = createAudioResource(stream.stream, { inputType: stream.type });
        serverQueue.player.play(resource);

        serverQueue.player.once(AudioPlayerStatus.Idle, () => {
            serverQueue.songs.shift();
            playSong(guildId, queues);
        });
    } catch (error) {
        console.error(`Error streaming [${song.title}]: ${error.message}`);
        serverQueue.songs.shift();
        playSong(guildId, queues);
    }
}