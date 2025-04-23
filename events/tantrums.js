const { ChannelType } = require('discord.js');

const tantrumPhrases = [
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA",
	"MEOWWW! MEOWWWW! MEOWWWWWWWWWWWWWWW!",
	"MOOOOOOOOOOOOOO MOOOOOOOOOOOOOOOO",
    "AWIWIWIWIWIWIWI WIWIWIWIWIWIWI"
];

let isTantrumActive = false;

function getRandomInterval(minMinutes = 10, maxMinutes = 1440) {
	const ms = Math.floor(Math.random() * (maxMinutes - minMinutes + 1) + minMinutes) * 60 * 1000;
	return ms;
}

function startTantrumLoop(client, channelId) {
	const triggerTantrum = async () => {
		if (isTantrumActive) return; // prevent stacking
		isTantrumActive = true;

		const channel = await client.channels.fetch(channelId);
		if (!channel || channel.type !== ChannelType.GuildText) return;

		const tantrumMsg = await channel.send({
			content: tantrumPhrases[Math.floor(Math.random() * tantrumPhrases.length)],
		});

		await tantrumMsg.react('🖐️'); // Pet
		await tantrumMsg.react('🍖'); // Treat

		const filter = (reaction, user) => {
			return ['🖐️', '🍖'].includes(reaction.emoji.name) && !user.bot;
		};

		const collector = tantrumMsg.createReactionCollector({ filter, max: 5, time: 60000 });

		collector.on('collect', (reaction, user) => {
			channel.send(`Thanks <@${user.id}>! I feel better now. 😸`);
			isTantrumActive = false;
			collector.stop();
		});

		collector.on('end', collected => {
			if (!collected.size) {
				channel.send("No one helped me... 😿");
				channel.send("https://tenor.com/view/sad-sad-white-cat-sadcat-sad-cat-white-cat-gif-10685945192669892930");
				isTantrumActive = false;
			}
			setTimeout(triggerTantrum, getRandomInterval());
		});
	};

	setTimeout(triggerTantrum, getRandomInterval());
}

module.exports = startTantrumLoop;
