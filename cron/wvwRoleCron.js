// wvw-role-cron.js

const cron = require('node-cron');
const { updateAllUsersWvwRoles } = require('../gw2ApiHelpers/tasks.js');

/**
 * Schedules the weekly WvW role update task.
 * @param {Client} client - The Discord.js Client instance.
 */
function scheduleWvwRoleUpdate(client) {
    // Cron schedule for every Saturday at 10:15 AM.
    // Format: (Minute Hour DayOfMonth Month DayOfWeek)
    // '15 10 * * 6' means at 10:15 on Saturday.
    const schedule = '15 10 * * 6';

    console.log(`Scheduling WvW Role Update job for every Saturday at 10:15 AM (Asia/Manila time).`);

    cron.schedule(schedule, () => {
        console.log(`[Cron Job] It's time! Triggering the weekly role update task.`);
        updateAllUsersWvwRoles(client);
    }, {
        scheduled: true,
        timezone: "Asia/Manila" // IMPORTANT: Set the timezone to your location.
    });
}

module.exports = { scheduleWvwRoleUpdate };