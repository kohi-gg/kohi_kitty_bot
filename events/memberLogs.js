// events/memberLogs.js

const { Events } = require('discord.js');

module.exports = (client) => {
    const MEMBER_LOG_CHANNEL_ID = "1364930867591516250"

    // Member Join
    client.on(Events.GuildMemberAdd, async (member) => {
        try {
            const channel = member.guild.channels.cache.get(MEMBER_LOG_CHANNEL_ID);

            if (!channel) return;

            await channel.send({
                embeds: [{
                    color: 0x57F287,
                    title: '📥 Member Joined',
                    thumbnail: {
                        url: member.user.displayAvatarURL({ dynamic: true })
                    },
                    fields: [
                        {
                            name: 'Member',
                            value: `${member.user.tag} (<@${member.id}>)`,
                            inline: true
                        },
                        {
                            name: 'Account Created',
                            value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                            inline: true
                        }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });

        } catch (error) {
            console.error('Member join log error:', error);
        }
    });

    // Member Leave
    client.on(Events.GuildMemberRemove, async (member) => {
        try {
            const channel = member.guild.channels.cache.get(MEMBER_LOG_CHANNEL_ID);

            if (!channel) return;

            await channel.send({
                embeds: [{
                    color: 0xED4245,
                    title: '📤 Member Left',
                    thumbnail: {
                        url: member.user.displayAvatarURL({ dynamic: true })
                    },
                    fields: [
                        {
                            name: 'Member',
                            value: `${member.user.tag} (${member.id})`,
                            inline: true
                        },
                        {
                            name: 'Joined Server',
                            value: member.joinedTimestamp
                                ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`
                                : 'Unknown',
                            inline: true
                        }
                    ],
                    timestamp: new Date().toISOString()
                }]
            });

        } catch (error) {
            console.error('Member leave log error:', error);
        }
    });

    console.log('Member Logs event loaded.');
};