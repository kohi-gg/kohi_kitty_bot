const pool = require('./db');
const cron = require('node-cron');
const { wvwTeam } = require('./wvwTeam');
const { getCurrentTeam } = require('./getCurrentTeam');
const { fetchUserData } = require('./fetchUserData');
const { updateWvwData } = require('./updateWvwData');
const { sendUpdateMessage } = require('./sendUpdateMessage');

require('dotenv').config({ path: './.env' });

async function updateTeamId(client) {
    
    try {
        // getting current team name
        const singleResult = await pool.query('SELECT team_id FROM user_api_keys WHERE discord_user_id = $1;', [process.env.DISCORD_USER_ID]);
        const currentTeam = await getCurrentTeam(singleResult.rows[0].team_id);

        const newTeamName = await wvwTeam(process.env.API_KEY);

        if (currentTeam !== newTeamName) {
            const users = await fetchUserData();
            const guild = client.guilds.cache.first();

            for (const user of users) {
                await updateWvwData(user, guild);
            }

            await sendUpdateMessage(client, newTeamName);
        }


    } catch (error) {
        console.error('Error updating data:', error);
    }
}


module.exports = (client) => {
    cron.schedule('15 2 * * 6', () => {
        updateTeamId(client);
    });
};

