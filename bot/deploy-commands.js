const { REST, Routes } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: './.env' });

const commands = [];
const foldersPath = path.join(__dirname, 'commands');

// Function to load commands from a directory
function loadCommandsFromFolder(folderPath) {
  const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const command = require(filePath);

    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
    } else {
      console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);

    }
  }
}

// Load commands from all subfolders
const commandFolders = fs.readdirSync(foldersPath);
for (const folder of commandFolders) {
  const folderPath = path.join(foldersPath, folder);
  loadCommandsFromFolder(folderPath);
}

// Environment variable handling
const { 
  DISCORD_TOKEN, 
  CLIENT_ID, 
  KOHI_DISCORD_ID, 
  TEST_DISCORD_TOKEN, 
  TEST_CLIENT_ID, 
  TEST_DISCORD_ID,
  DEBUG 
} = process.env;

let token;
let clientId;
let discordId;

if (DEBUG === 'development'){
  token = TEST_DISCORD_TOKEN;
  clientId = TEST_CLIENT_ID;
  discordId = TEST_DISCORD_ID;
} else if (DEBUG === 'production') {
  token = DISCORD_TOKEN;
  clientId = CLIENT_ID;
  discordId = KOHI_DISCORD_ID;
}

const rest = new REST().setToken(token);

(async () => {
  try {
    console.log(`Started refreshing ${commands.length} application (/) commands.`);
    const data = await rest.put(
      Routes.applicationGuildCommands(clientId, discordId),
      { body: commands },
    );
    console.log(`Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error(error);
  } finally {
    // This will run whether the try block succeeds or catches an error
    console.log('deploying command process ending...');
    process.exit(0); // 0 indicates successful termination    
  }
})();