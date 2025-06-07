const { ChannelType } = require('discord.js');

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
	"hMPFK!!!"
];

const sadMessages = [
	"https://tenor.com/view/sad-sad-white-cat-sadcat-sad-cat-white-cat-gif-10685945192669892930",
	"NO ONE CARES HMP!!!!",
	"https://tenor.com/view/crying-cat-sad-cat-me-when-i-dont-get-orod-tickets-gif-13399313231964052110",
	"https://tenor.com/view/cat-crying-crying-cat-sad-cat-tears-gif-8667404633191338902",
	"https://tenor.com/view/banana-cat-gif-6227991838366394061",
	"I'm just a little guy... and nobody cares. 😢",
	"https://tenor.com/view/bard1a-sad-cat-sad-dark-dark-side-gif-11200514925795091536"
];

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

const getRandomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const delay = (ms) => new Promise(res => setTimeout(res, ms));
const getRandomInterval = (min = 5, max = 360) => Math.floor(Math.random() * ((max - min) * 60000)) + min * 60000;

function startTantrumLoop(client, channelId) {
	const triggerTantrum = async () => {
		if (isTantrumActive) return;
		isTantrumActive = true;

		try {
			const channel = await client.channels.fetch(channelId);
			if (!channel || channel.type !== ChannelType.GuildText) return;

			const content = getRandomItem(tantrumPhrases);
			const tantrumMsg = await channel.send(content);
			await tantrumMsg.react('🍖').catch(console.error);

			const collector = tantrumMsg.createReactionCollector({
				filter: (reaction, user) => reaction.emoji.name === '🍖' && !user.bot,
				max: 5,
				time: 180_000
			});

			collector.on('collect', (reaction, user) => {
				channel.send(getRandomItem(thankYouMessages).replace('{userId}', user.id)).catch(console.error);
				collector.stop();
			});

			collector.on('end', async (collected) => {
				if (collected.size === 0) {
					await channel.send("No one helped me... 😿").catch(console.error);
					await channel.send(getRandomItem(sadMessages)).catch(console.error);
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
