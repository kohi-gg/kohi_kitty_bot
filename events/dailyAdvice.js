const cron = require('node-cron');
const moment = require('moment-timezone');
const fetch = require('node-fetch');
const { ChannelType } = require('discord.js');

function startDailyAdvice(client, channelId) {
	// Schedule: At 8:00 AM Asia/Manila time every day
	cron.schedule('0 8 * * *', async () => {
		const nowPH = moment().tz('Asia/Manila').format('YYYY-MM-DD HH:mm:ss');
		console.log(`Sending daily advice at ${nowPH} PH time.`);

		try {
			const channel = await client.channels.fetch(channelId);
			if (!channel || channel.type !== ChannelType.GuildText) return;

			const response = await fetch('https://api.adviceslip.com/advice');
			const data = await response.json();
			const advice = data.slip.advice;

			await channel.send(`📅 **Daily Advice @ 8:00AM PHT:**\n💡 ${advice}`);
		} catch (error) {
			console.error('Error sending daily advice:', error);
		}
	}, {
		timezone: 'Asia/Manila' // ensure it's on PH time
	});
}

module.exports = startDailyAdvice;
