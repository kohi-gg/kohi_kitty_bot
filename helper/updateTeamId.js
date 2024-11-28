const pool = require('./db');
const axios = require('axios');
const cron = require('node-cron');
const { wvwTeam } = require('./wvwTeam');
const { getCurrentTeam } = require('./getCurrentTeam');

require('dotenv').config({ path: './.env' });


let channelId = null;
if (process.env.DEBUG === 'development') {
    channelId = process.env.TEST_CHANNEL_ID;
} else if (process.env.DEBUG === 'production') {
    channelId = process.env.TEST_CHANNEL_ID;
}

async function updateTeamId(client) {
    
    try {
        // getting current team name
        const singleResult = await pool.query('SELECT team_id FROM user_api_keys WHERE discord_user_id = $1;', [process.env.DISCORD_USER_ID]);

        const currentTeam = await getCurrentTeam(singleResult.rows[0].team_id);
        const channel = client.channels.cache.get(channelId);
        const guild = client.guilds.cache.first();



        const result = await pool.query('SELECT * FROM user_api_keys;');
        const rows = result.rows;

        
        const newTeamName = await wvwTeam(process.env.API_KEY)

      
        
        if (currentTeam != newTeamName) {
            
            rows.forEach( async (element) => {
                const apiKey = element["api_key"];
                const response = await axios.get('https://api.guildwars2.com/v2/account/wvw', {
                    headers: {
                      Authorization: `Bearer ${apiKey}`
                    }
                });

                const discordUserId = element["discord_user_id"]
                const newTeamId = response.data.team;


                if (element["team_id"] != newTeamId) {
                    ///
                    const roleName = await wvwTeam(apiKey);
                    const member = await guild.members.fetch(discordUserId);

                    // Find the role for the user's current team
                    const currentRole = guild.roles.cache.find(role => role.name === currentTeam);
                
                    // Remove the old role if it exists and is different from the new one
                    if (currentRole) {
                        await currentRole.delete();
                        console.log(`Deleted role: ${currentRole.name}`);
                    }

                    // Find or create the new team role
                    let teamRole = guild.roles.cache.find(role => role.name === roleName);
                    if (!teamRole) {
                        teamRole = await guild.roles.create({
                          name: roleName,
                          color: '#FFFF9F',
                          reason: 'WvW team role',
                        });
                        console.log(`Created role: ${roleName}`);
                    }

                    // Add the new role
                    await member.roles.add(teamRole);
                    console.log(`Changed to role @${roleName} to user ${element["account_name"]}`);                  

                    ///
                    await pool.query('UPDATE user_api_keys SET team_id = $1 WHERE discord_user_id = $2;', [newTeamId, discordUserId]);
                    console.log(`${element["account_name"]}'s team id was updated.`);

                }
            });


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
                channel.send({ embeds: [helpEmbed] });            
            } else {
                console.error('Channel not found!');
            }
            
        }
    } catch (error){
    console.error('Error updating data: ', error);
    }
}

module.exports = (client) => {
    cron.schedule('15 2 * * 6', () => {
        updateTeamId(client);
    });
};