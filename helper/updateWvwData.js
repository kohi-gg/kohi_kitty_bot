const axios = require('axios');
const pool = require('./db');
const { wvwTeam } = require('./wvwTeam');
const { getCurrentTeam } = require('./getCurrentTeam');

async function updateWvwData(user, guild) {
    try {
        const userApiKey = user.api_key;
        const discordUserId = user.discord_user_id;

        const response = await axios.get('https://api.guildwars2.com/v2/account/wvw', {
            headers: { Authorization: `Bearer ${userApiKey}` }
        });    
        
        const newTeamId = response.data.team;

        const roleName = await wvwTeam(userApiKey);
        console.log(roleName);

        // Find or create the new team role
        let teamRole = guild.roles.cache.find(role => role.name === roleName);
        if (!teamRole) {
            teamRole = await guild.role.create({
                name: roleName,
                color: '#FFFF9F',
                reason: 'WvW team role update',
            });
            console.log(`Created new role: ${roleName}`);
        }

        try {
            const member = await guild.members.fetch(discordUserId);

            if (user.team_id !== newTeamId) {
                // Find the current role for the user's current team
                const currentRole = guild.roles.cache.find(role => role.name === getCurrentTeam(user.team_id));

                if (currentRole) {
                    await member.roles.remove(currentRole);
                    console.log(`Removed role: ${currentRole.name} from ${user.account_name}`);
                }

                // Add the new role
                await member.roles.add(teamRole);
                console.log(`Added role: @${roleName} to ${user.account_name}`);

                // Update team id to user_api_keys database
                await pool.query('UPDATE user_api_keys SET team_id = $1 WHERE discord_user_id = $2;', [newTeamId, discordUserId]);
                console.log(`${user.account_name}'s team ID was updated.`);
            }
        } catch (memberError) {
            console.error(`Member not found: ${user.account_name}. Error:`, memberError);
        }
    } catch (apiError) {
        console.error(`Error updating WvW data for ${user.account_name}:`, apiError);
    }
}

module.exports = { updateWvwData };