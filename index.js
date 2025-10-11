const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, Message, Partials } = require('discord.js');
//const { Breed, TheCatAPI } = require("@thatapicompany/thecatapi");
const { scheduleWvwRoleUpdate } = require('./cron/wvwRoleCron.js');
//const play = require('play-dl'); -- for music pero pagaaralan ko pa.

// added by serjeph
const { GoogleGenAI } = require('@google/genai');
const { generateKohiResponse } = require('./handlers/geminiHandler.js');

// Load environment variables from .env file
require('dotenv').config({ path: './.env' });

/* // --- PLAY-DL CONFIG ---  disabled for now
async function configurePlayDl() {
	await play.setToken({
		spotify: {
			client_id: process.env.SPOTIFY_CLIENT_ID,
			client_secret: process.env.SPOTIFY_CLIENT_SECRET,
			refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
			market: 'US'
		}
	});
	if (play.is_expired()) {
		await play.refreshToken();
	}
	console.log('play-dl configured successfully!');
}
configurePlayDl(); */
// ------------------------


const client = new Client({
	intents: [GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildVoiceStates, // Required to check if a user is in a voice channel
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMessageReactions, // ✅ Required for reactions
		GatewayIntentBits.GuildMembers // If you want user mentions in embeds
	],
	partials: [Partials.Message, Partials.Reaction, Partials.User]
});

// Initialize Gemini AI
// serjeph
const ai = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY
});

client.cooldowns = new Collection();
client.commands = new Collection();
client.queues = new Map(); // For music queues
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

//MODELS
const Data = require("./helper/data")

//Channel list (exception)
const EXCEPTION_CHANNELS = [
	"1151368598988783646",
	"1151367076313837588",
	"1191988352560406559",
	"1371750538626207754",
	"1175259018801971331",
	"1160840900507881482",
	"1193748324164059196",
	"1241302472618934313",
	"1160841042870939689",
	"1193496566368059402",
	"1192702591117824000",
	"1416995825250209874",
];

// setting up and run server
const server = require('./server/server');


for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);

	var guild = "";
	// Determine the guild based on the environment variable
	if (process.env.DEBUG === 'development') {
		console.log("in development mode...");
		// In development, we use the TEST_DISCORD_ID from the environment variables
		guild = client.guilds.cache.get(process.env.TEST_DISCORD_ID);
	} else if (process.env.DEBUG === 'production') {
		console.log("in production mode...");
		// In production, we use the KOHI_DISCORD_ID from the environment variables
		guild = client.guilds.cache.get(process.env.KOHI_DISCORD_ID);
	}

	// If the guild is not found, log an error
	if (!guild) {
		console.error('Guild not found. Please check your environment variables.');
		return;
	}

	if (guild) {
		// Set the presence
		c.user.setPresence({
			activities: [{
				name: `over ${guild.name}.`,
				type: ActivityType.Watching
			}],
			status: 'online'

		});
	}

	//tantrum loop
	/*const startTantrumLoop = require('./events/tantrums');
	const TANTUM_CHANNEL_ID = '1161806056817709066'; // replace with a real channel ID

	startTantrumLoop(client, TANTUM_CHANNEL_ID);*/

	//Daily Advice 8AM PH time
	const startDailyAdvice = require('./events/dailyAdvice');
	const ADVICE_CHANNEL_ID = '1161806056817709066'; // cafe channel

	startDailyAdvice(client, ADVICE_CHANNEL_ID);

	const startCleanupJob = require("./events/dbcleanup.js");

	// After client.login(...)
	startCleanupJob();


	// Start all scheduled jobs now that the client is ready.
	// jeph edit 2025/10/04
	// Pass the channel ID for WvW notifications from environment variables.
	// Make sure to set WVW_CHANNEL_ID in your .env file.
	// Example: WVW_CHANNEL_ID=123456789012345678
	// lagay natin lagi sa env files para mas madali i-configure
	// and less chance of hardcoding the wrong value.
	scheduleWvwRoleUpdate(client, process.env.WVW_CHANNEL_ID);
});


client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;
	const command = client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	const { cooldowns } = interaction.client;

	if (!cooldowns.has(command.data.name)) {
		cooldowns.set(command.data.name, new Collection());
	}

	const now = Date.now();
	const timestamps = cooldowns.get(command.data.name);
	const defaultCooldownDuration = 3;
	const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

	if (timestamps.has(interaction.user.id)) {
		const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

		if (now < expirationTime) {
			const expiredTimestamp = Math.round(expirationTime / 1000);
			return interaction.reply({ content: `Please wait, you are on a cooldown for \`${command.data.name}\`. You can use it again <t:${expiredTimestamp}:R>.`, ephemeral: true });
		}
	}

	timestamps.set(interaction.user.id, now);
	setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on('messageReactionRemove', async (reaction, user) => {
	if (user.bot) return;

	// Make sure everything is fully fetched (partials!)
	if (reaction.partial) await reaction.fetch();
	if (reaction.message.partial) await reaction.message.fetch();

});


client.on(Events.MessageCreate, async (message) => {
	if (message.author.bot) return;


	// now powered with Gemini AI
	let isReplyToBot = false;
	// Check if the message is a reply
	if (message.reference && message.reference.messageId) {
		try {
			const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
			// Check if the replied-to message is from the bot
			if (referencedMessage.author.id === message.client.user.id) {
				isReplyToBot = true;
			}
		} catch (error) {
			console.error("Could not fetch the referenced message, it might have been deleted.");
		}
	}

	// If the bot is mentioned OR the message is a reply to the bot, trigger generateKohiResponse
	if (message.mentions.has(client.user.id) || isReplyToBot) {
		await generateKohiResponse(message, ai);
	} else { // Otherwise, fall back to the random reply logic
		if (EXCEPTION_CHANNELS.includes(message.channel.id)) return;

		if (Math.random() > 0.03) return;

		const replies = ["meow 😺", "nya~", "meow~", "nya!", "ARF! ARF!", "HAHAHAHA", "EH ANO???","weeeeeee???","potek hahahaha", "dinga?",
			"Hala Bakit?", "ganun?", "pero ok ka lang?", "sanaol! AHAHAHA", "bukas makalawa", "sana ok ka lang",
			"batet?", "eh kung ganon wag nalang", "oh?", "oh talaga??","true!!","sikret!!","utot mo blue! HAHAHA","maya bz aq","oh talaga?","agree ako jan, meow!",
			"Ok sige", "Oo nalang .. Duhhh", "Diba hindi?", "shempre hindi", "sana ginawa mo na", "wala to?!?", "mama mo!", "mama mo cute", "Boss", "share mo lang?",
			"gusto kaba?", "yun lang!", "shet inaantok nako", "mahal mo?", "uy wag ka mama ko cute", "suntukan"
		];
		const reply = replies[Math.floor(Math.random() * replies.length)];

		await message.reply(reply);
	}


});

if (process.env.DEBUG === 'development') {
	console.log("in debug mode...");
	client.login(process.env.TEST_DISCORD_TOKEN);
} else if (process.env.DEBUG === 'production') {
	console.log("in production mode...");
	client.login(process.env.DISCORD_TOKEN);
}

server();
