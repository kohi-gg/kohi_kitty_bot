


require('dotenv').config({ path: './.env'});


let channelId = null;
if (process.env.DEBUG === 'development') {
    channelId = process.env.TEST_CHANNEL_ID;
} else if (process.env.DEBUG === 'production') {
    channelId = process.env.CHANNEL_ID;
}

async function sendUpdateMessage(client, newTeamName) {
    try {
        const channel = client.channels.cache.get(channelId);

        const helpEmbed = {
            color: 0x0099ff,
            title: 'New WvW Team Update',
            description: '',
            fields: [
              {
                name: 'Updated WvW Role',
                value: `Our WvW role has changed to **@${newTeamName}**\n`
              },
              {
                name: "You don't have wvw team role yet?",
                value: "type `/getkakampi` command to get a role.\n"
              },
              {
                name: 'Need Help?',
                value: 'If you encounter any errors, issues, or have concerns, feel free to ping <@&1158659592767668286>.\n',
              },
            ],
            timestamp: new Date(),
            footer: {
              text: "Kohi's digital twin",
            },
        };

        if (channel) {
            channel.send({ embeds: [helpEmbed]});
        } else {
            console.error('Channel not found!');
        }
    } catch (error) {
        console.error('Error sending update message:', error);
    }
}

module.exports = { sendUpdateMessage };