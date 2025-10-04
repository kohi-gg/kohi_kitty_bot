// tasks.js

const { Client } = require('pg');
const pool = require('../helper/db.js');
const { updateWvwTeamRole } = require('./updateWvwTeamRole.js');

/**
 * Fetches all users from the database and runs the role update process for each one,
 * sending notifications to WvW channel if needed.
 * @param {Client} client The Discord client instance. 
 * @param {string} channelId The ID of the channel to send notifications to.
 */
async function updateAllUsersWvwRoles(client, channelId) {
    // Helper function to send notifications to the WvW channel.
    const sendNofication = async (message) => {
        try {
            const channel = await client.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
                await channel.send(message);
            } else {
                console.error(`Channel with ID ${channelId} is not text-based or could not be found.`);
            }
        } catch (error) {
            console.error(`Failed to send message to channel ${channelId}:`, error);
        }
    };

    await sendNofication('Starting weekly WvW role update for all users registered in ``/set-api``...');
    try {
        // 1. Fetch all users who have stored an API key.
        const result = await pool.query('SELECT discord_user_id FROM user_api_keys');
        const users = result.rows;

        if (users.length === 0) {
            console.log('No users found in the database. Cron job complete.');
            await sendNofication('No users found in the database. Cron job complete.');
            return;
        }

        await sendNofication(`Found ${users.length} user(s) to process.`);

        // 2, Loop through each user and update their role.
        let successCount = 0;
        let failureCount = 0;
        for (const user of users) {
            try {
                console.log(`Processing user: ${user.discord_user_id}`);
                await updateWvwTeamRole(client, user.discord_user_id);
                successCount++;

                // Add a small delay between each user to be respectful to the Discord and GW2 APIs.
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
            } catch (error) {
                // Log an error for a single user but continue the loop for the others.
                console.error(`Failed to process user ${user.discord_user_id}. Error: ${error.message}`);
                failureCount++;
                //await sendNofication(`Failed to process user <@${user.discord_user_id}>. Error: ${error.message}`);
            }
        }

        await sendNofication(`Weekly WvW role update complete. Successfully processed ${successCount} user(s). ${failureCount} user(s) failed.`);
    } catch (error) {
        console.error('A critical error occurred during the updateAllUsersWvwRoles task:', error);
        await sendNofication('A critical error occurred during the WvW role update task. Check logs for details.');
    } finally {
        console.log('--- Weekly WvW role update task finished ---');
        await sendNofication('--- Weekly WvW role update task finished ---');
    }
}

module.exports = { updateAllUsersWvwRoles };