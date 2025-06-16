// updateWvwTeamRole.js

const fs = require('fs/promises');
const path = require('path');
const pool = require('../helper/db.js');
const { getKohiTeamName } = require('./getKohiTeamName.js');
require('dotenv').config({ path: '../.env' });

let kohiDiscordId;

if (process.env.DEBUG === 'development') {
    kohiDiscordId = process.env.TEST_DISCORD_ID;
} else if (process.env.DEBUG === 'production') {
    kohiDiscordId = process.env.KOHI_DISCORD_ID;
}

/**
 * Updates a Discord user's role to match their current GW2 WvW team,
 * removing any previous WvW team roles.
 */
async function updateWvwTeamRole(client, discordUserId) {
    // Step 1: Get the user's stored API key from the database.
    const userQuery = await pool.query('SELECT api_key FROM user_api_keys WHERE discord_user_id = $1', [discordUserId]);
    if (userQuery.rows.length === 0) {
        console.log(`No API key on record for Discord user ${discordUserId}. Cannot update role.`);
        return;
    }
    const apiKey = userQuery.rows[0].api_key;

    // Step 2: Get the user's current WvW team name.
    const newTeamName = await getKohiTeamName(apiKey);

    // Step 3: Fetch the necessary Discord objects (server and member).
    // Your bot needs to know which server to operate on. Store this in your .env file.
    const guild = await client.guilds.fetch(kohiDiscordId);
    if (!guild) {
        throw new Error(`Bot could not find the configured server with ID: ${kohiDiscordId}`);
    }
    const member = await guild.members.fetch(discordUserId).catch(() => null);
    if (!member) {
        console.log(`Could not find member with ID ${discordUserId} in the server.`);
        return;
    }

    // Step 4: Determine all possible WvW team roles to manage.
    const wvwTeamsPath = path.join(__dirname, 'wvwTeams.json');
    const wvwTeamsData = await fs.readFile(wvwTeamsPath, 'utf8');
    const wvwTeams = JSON.parse(wvwTeamsData);
    const allWvwTeamNames = new Set(Object.values(wvwTeams).map(team => team.en));

    // Step 5: Find which of these roles the member currently has.
    const rolesToRemove = member.roles.cache.filter(role => allWvwTeamNames.has(role.name));

    // If the user has no team name (e.g., not in a WvW guild), just remove old roles and stop.
    if (!newTeamName || newTeamName === 'Unknown') {
        if (rolesToRemove.size > 0) {
            await member.roles.remove(rolesToRemove, 'User is no longer assigned to a WvW team.');
            console.log(`Removed WvW roles from ${member.user.tag} as they have no current team.`);
        }
        return;
    }

    // Step 6: Find or create the new role the user should have.
    let newRole = guild.roles.cache.find(r => r.name === newTeamName);
    if (!newRole) {
        console.log(`Role "${newTeamName}" not found. Creating it...`);
        newRole = await guild.roles.create({
            name: newTeamName,
            color: 'ffff00', // Example color, adjust as needed
            reason: 'Automatic WvW team role creation.',
        });
    }

    // Step 7: Update the user's roles.
    // First, remove old roles that are not the new role.
    const finalRolesToRemove = rolesToRemove.filter(role => role.id !== newRole.id);
    if (finalRolesToRemove.size > 0) {
        await member.roles.remove(finalRolesToRemove, 'Updating WvW team role.');
        console.log(`Removed old role(s) from ${member.user.tag}.`);
    }

    // Then, add the new role if they don't already have it.
    if (!member.roles.cache.has(newRole.id)) {
        await member.roles.add(newRole, 'Assigning current WvW team role.');
        console.log(`Assigned role "${newTeamName}" to ${member.user.tag}.`);
    } else {
        console.log(`${member.user.tag} already has the correct role: "${newTeamName}".`);
    }
}

module.exports = { updateWvwTeamRole };