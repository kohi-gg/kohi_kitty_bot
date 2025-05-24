const { ChannelType } = require('discord.js');

// 🐾 Tantrum phrases with fun and expressive content
const tantrumPhrases = [
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 😾",
	"MEOWWWWWWWWWWWWWWWWWWWWWWWWWWW!",
	"MOOOOOOOOOOOOOOOOOOOOOOOOO 🐮",
	"AWIWIWIWIWIWIWI WIWIWIWIWIWIWI 🤪",
	"https://tenor.com/view/angry-cat-mad-annoyed-hissy-fit-meow-gif-24700592",
	"https://tenor.com/view/cat-angry-angry-cat-yelling-shout-gif-26484758",
	"HUE HUE HUE",
	"https://tenor.com/view/cat-break-stuff-angry-smash-destroy-gif-22197895",
	"I'm in a mood and PANGET MO! 🧨",
	"https://tenor.com/view/cat-mad-angry-gif-24088802"
];

// 😿 Sad messages and GIFs if no one helps
const sadMessages = [
	"https://tenor.com/view/sad-sad-white-cat-sadcat-sad-cat-white-cat-gif-10685945192669892930",
	"https://tenor.com/view/sad-sad-cat-cry-gif-15794792",
	"https://tenor.com/view/cry-cat-tears-gif-22423772",
	"https://tenor.com/view/cat-sad-alone-depressed-gif-22040194",
	"https://tenor.com/view/sad-sob-sad-cat-cry-cat-cat-gif-22070583",
	"I'm just a little guy... and nobody cares. 😢",
	"https://tenor.com/view/lonely-cat-gif-24880330"
];

let isTantrumActive = false;

function getRandomInterval(minMinutes = 10, maxMinutes = 1440) {
	const minMs = minMinutes * 60 * 1000;
	const maxMs = maxMinutes * 60 * 1000;
	return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

function startTantrumLoop(client, channelId) {
	const triggerTantrum = async () => {
		if (isTantrumActive) return;
		isTantrumActive = true;

		try {
			const channel = await client.channels.fetch(channelId);
			if (!channel || channel.type !== ChannelType.GuildText) return;

			const content = tantrumPhrases[Math.floor(Math.random() * tantrumPhrases.length)];

			const tantrumMsg = await channel.send({ content });

			await tantrumMsg.react('🖐️').catch(console.error);
			await tantrumMsg.react('🍖').catch(console.error);

			const filter = (reaction, user) =>
				['🖐️', '🍖'].includes(reaction.emoji.name) && !user.bot;

			const collector = tantrumMsg.createReactionCollector({
				filter,
				max: 5,
				time: 60_000
			});

			collector.on('collect', (reaction, user) => {
				channel.send(`Thanks <@${user.id}>! I feel better now. 😸`).catch(console.error);
				collector.stop(); // Stop on first valid reaction
			});

			collector.on('end', async (collected) => {
				if (collected.size === 0) {
					// Wait 3 minutes before sad response
					await new Promise(resolve => setTimeout(resolve, 3 * 60 * 1000));

					await channel.send("No one helped me... 😿").catch(console.error);
					const sadMsg = sadMessages[Math.floor(Math.random() * sadMessages.length)];
					await channel.send(sadMsg).catch(console.error);
				}
				isTantrumActive = false;
				setTimeout(triggerTantrum, getRandomInterval());
			});
		} catch (err) {
			console.error("Error in triggerTantrum:", err);
			isTantrumActive = false;
			setTimeout(triggerTantrum, getRandomInterval());
		}
	};

	setTimeout(triggerTantrum, getRandomInterval());
}

module.exports = startTantrumLoop;
