const { Events, EmbedBuilder } = require('discord.js');

function startMemberLogs(client, channelId) {

    client.on(Events.GuildMemberAdd, async (member) => {
        try {
            const channel = await client.channels.fetch(channelId);

            if (!channel) return;

            const embed = new EmbedBuilder()
                .setColor(0x57F287)
                .setTitle('📥 Member Joined')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
                    {
                        name: 'Member',
                        value: `${member.user.tag} (<@${member.id}>)`,
                        inline: true
                    },
                    {
                        name: 'Account Created',
                        value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
                        inline: true
                    },
                    {
                        name: 'Member Count',
                        value: `${member.guild.memberCount}`,
                        inline: true
                    }
                )
                .setTimestamp();

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error logging member join:', error);
        }
    });

    client.on(Events.GuildMemberRemove, async (member) => {
        try {
            const channel = await client.channels.fetch(channelId);

            if (!channel) return;

            const embed = new EmbedBuilder()
                .setColor(0xED4245)
                .setTitle('📤 Member Left')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
                .addFields(
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
                )
                .setTimestamp();

            await channel.send({ embeds: [embed] });

        } catch (error) {
            console.error('Error logging member leave:', error);
        }
    });

    console.log('Member logging initialized.');
}

module.exports = startMemberLogs;