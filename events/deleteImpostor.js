// This event handler listens for new messages and deletes any messages from a specific user.
const targetUserId = '1173207776751800360'; // The ID of the user whose messages you want to delete

module.exports = {
    name: 'messageCreate', // The name of the event
    async execute(message, client) { // 'client' might be passed if your handler needs it for other things
        // Ignore messages from bots or if the message doesn't have an author (e.g., system messages)
        if (message.author.bot || !message.author) {
            return;
        }

        // Check if the message author's ID is the one we're targeting
        if (message.author.id === targetUserId) {
            try {
                if (message.deletable) { // Check if the message can be deleted
                    await message.delete();
                    console.log(`[EVENT: messageCreate] Deleted message from ${message.author.tag} (ID: ${message.author.id}) in channel #${message.channel.name} in guild ${message.guild.name}.`);
                } else {
                    console.warn(`[EVENT: messageCreate] Message from ${message.author.tag} (ID: ${targetUserId}) was not deletable.`);
                }
            } catch (error) {
                console.error(`[EVENT: messageCreate] Failed to delete message from ${message.author.tag} (ID: ${targetUserId}): ${error}`);
                // Consider more robust error handling, e.g., notifying an admin if deletion persistently fails.
            }
        }
    },
};