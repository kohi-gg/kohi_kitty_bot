const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits, ActivityType, Message ,Partials} = require('discord.js');
const { Breed, TheCatAPI } = require("@thatapicompany/thecatapi");
require('dotenv').config({ path: './.env' });
const updateTeamId = require('./helper/updateTeamId');

const client = new Client({ intents: [	GatewayIntentBits.Guilds,
										GatewayIntentBits.GuildMessages,
										GatewayIntentBits.MessageContent,
										GatewayIntentBits.GuildMessageReactions, // ✅ Required for reactions
										GatewayIntentBits.GuildMembers // If you want user mentions in embeds
	],
	partials: [Partials.Message, Partials.Reaction, Partials.User]
});

client.cooldowns = new Collection();
client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

//MODELS
const Data = require("./helper/data")

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
	const startTantrumLoop = require('./events/tantrums');
	const TANTUM_CHANNEL_ID = '1161806056817709066'; // replace with a real channel ID

	startTantrumLoop(client, TANTUM_CHANNEL_ID);

	//Daily Advice 8AM PH time
	const startDailyAdvice = require('./events/dailyAdvice');
	const ADVICE_CHANNEL_ID = '1161806056817709066'; // cafe channel

	startDailyAdvice(client, ADVICE_CHANNEL_ID);

	
 	// Initialize the cron job here
	updateTeamId(client);
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

if (process.env.DEBUG === 'development') {
	console.log("in debug mode...");
	client.login(process.env.TEST_DISCORD_TOKEN);
} else if (process.env.DEBUG === 'production') {
	console.log("in production mode...");
	client.login(process.env.DISCORD_TOKEN);
}

server();
