const { SlashCommandBuilder } = require('discord.js');
const { joinVoiceChannel } = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('join')
        .setDescription('Temporarily joins your voice channel and deafens.'),

    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        // 1. Check if the user is in a voice channel
        if (!voiceChannel) {
            return interaction.reply({ content: 'You must be in a voice channel to use this command.', ephemeral: true });
        }

        // 2. Check for permissions
        const permissions = voiceChannel.permissionsFor(interaction.client.user);
        if (!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
            return interaction.reply({ content: 'I need permissions to join and speak in your voice channel!', ephemeral: true });
        }

        try {
            // 3. Join the voice channel and deafen
            joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
                selfDeaf: true, // This is the option to deafen the bot
                selfMute: true
            });

            await interaction.reply({ content: `✅ Joined **${voiceChannel.name}** and deafened.` });

        } catch (error) {
            console.error(error);
            await interaction.reply({ content: 'There was an error trying to join the voice channel.', ephemeral: true });
        }
    },
};