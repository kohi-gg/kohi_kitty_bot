const { ChannelType } = require('discord.js');

// 🐾 Tantrum phrases with fun and expressive content
const tantrumPhrases = [
	"AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA 😾",
	"MEOWWWWWWWWWWWWWWWWWWWWWWWWWWW!",
	"MOOOOOOOOOOOOOOOOOOOOOOOOO 🐮",
	"AWIWIWIWIWIWIWI WIWIWIWIWIWIWI 🤪",
	"SINAYAAAAAAAAAAAAA",
	"https://tenor.com/view/cat-screaming-cat-scream-aaaaaaaah-gif-12740893762543074394",
	"HUE HUE HUE (┬┬﹏┬┬)",
	"https://tenor.com/view/fat-cat-laser-eyes-angry-cat-cyclops-nara-gif-5759191940836070229",
	"I'm in a mood",
	""
];

// 😿 Sad messages and GIFs if no one helps
const sadMessages = [
	"https://tenor.com/view/sad-sad-white-cat-sadcat-sad-cat-white-cat-gif-10685945192669892930",
	"NO ONE CARES HMP!!!!",
	"https://tenor.com/view/crying-cat-sad-cat-me-when-i-dont-get-orod-tickets-gif-13399313231964052110",
	"https://tenor.com/view/cat-crying-crying-cat-sad-cat-tears-gif-8667404633191338902",
	"https://tenor.com/view/banana-cat-gif-6227991838366394061",
	"I'm just a little guy... and nobody cares. 😢",
	"https://tenor.com/view/bard1a-sad-cat-sad-dark-dark-side-gif-11200514925795091536"
];

//Thank you messages
const thankYouMessages = [
	"Thanks <@{userId}>! I feel better now. 😸",
	"Aww, you're the best <@{userId}>! 💖",
	"*purrs* Thank you, <@{userId}>~ 🐾",
	"<@{userId}> gave me love. Mood: healed. 🥹",
	"Someone cares! Thank you <@{userId}>! 🐱",
	"<@{userId}> just saved the day! ✨",
	"You gave me pets and snacks! I'm so happy! 🍖🖐️"
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
			const msg = thankYouMessages[Math.floor(Math.random() * thankYouMessages.length)]
			.replace('{userId}', user.id);
			channel.send(msg).catch(console.error);
			collector.stop();
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
