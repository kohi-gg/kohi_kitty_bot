const cron = require("node-cron");
const Event = require("../helper/eventdata");
const EventSignup = require("../helper/eventsignup");

/**
 * Runs every 3 weeks and clears old event data.
 * Adjust age filter if you only want to delete "expired" events.
 */
function startCleanupJob() {
  // “0 0 * * 0” would be weekly, but here we run every 21 days at midnight
  cron.schedule("0 0 */21 * *", async () => {
    try {
      console.log("[Cleanup] Running scheduled database cleanup...");

      // Example: delete events older than 30 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 30);

      const oldEvents = await Event.find({ createdAt: { $lt: cutoff } });

      for (const event of oldEvents) {
        await EventSignup.deleteMany({ eventId: event._id });
        await Event.deleteOne({ _id: event._id });
      }

      console.log(`[Cleanup] Deleted ${oldEvents.length} old events and related signups.`);
    } catch (err) {
      console.error("[Cleanup] Error while cleaning database:", err);
    }
  });
}

module.exports = startCleanupJob;
