// tasks.js

const pool = require('../helper/db.js');
const { updateWvwTeamRole } = require('./updateWvwTeamRole.js');

/**
 * Fetches all users from the database and runs the role update process for each one.
 */
async function updateAllUsersWvwRoles(client) {
    console.log('--- Starting weekly WvW role update for all users ---');
    try {
        // 1. Fetch all users who have stored an API key.
        const result = await pool.query('SELECT discord_user_id FROM user_api_keys');
        const users = result.rows;

        if (users.length === 0) {
            console.log('No users found in the database. Cron job complete.');
            return;
        }

        console.log(`Found ${users.length} user(s) to process.`);

        // 2. Loop through each user and update their role.
        // We use a for...of loop to process users one by one, preventing rate-limiting issues.
        for (const user of users) {
            try {
                console.log(`Processing user: ${user.discord_user_id}`);
                await updateWvwTeamRole(client, user.discord_user_id);

                // Add a small delay between each user to be respectful to the Discord and GW2 APIs.
                await new Promise(resolve => setTimeout(resolve, 2000)); // 2-second delay
            } catch (error) {
                // Log an error for a single user but continue the loop for the others.
                console.error(`Failed to process user ${user.discord_user_id}. Error: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('A critical error occurred during the updateAllUsersWvwRoles task:', error);
    } finally {
        console.log('--- Weekly WvW role update task finished ---');
    }
}

module.exports = { updateAllUsersWvwRoles };