# Kohi Kitty Bot 🐾

Kohi Kitty Bot is a multipurpose Discord bot designed for the KOHI Guild, a Guild Wars 2 guild. This bot is intended to assist guild members with various tasks and provide entertainment.

## Features

  * **WvW Team Role Assignment:** Automatically assigns WvW team roles to guild members based on their Guild Wars 2 API key.
  * **Gemini AI Integration:** The bot is powered by Google's Gemini AI, allowing it to respond to user messages in a cat-like persona.
  * **Event Creation and Management:** Members can create and manage events for various in-game activities like Fractals, Dungeons, Raids, and more.
  * **Rock, Paper, Scissors Game:** A simple and fun game that users can play against the bot.
  * **GW2 API Integration:** The bot interacts with the Guild Wars 2 API to retrieve account and character information.

### Planned Features

  * **Guild Missions and Event Reminders:** Timely reminders for guild missions and events.
  * **Build and Gear Information:** Access to build and gear information directly from Discord.
  * **Helpful GW2 Resources:** Quick links to essential Guild Wars 2 resources.

## Commands

| Command | Description |
| :--- | :--- |
| `/set-api` | Set your Guild Wars 2 API key. |
| `/whats-my-team` | Get your World vs. World team information. |
| `/create-event` | Create an event for Fractals, Dungeons, Raids, Open World, WvW, or Strikes. |
| `/sqjoin` | Join an event with a chosen role. |
| `/leave` | Leave an event you have signed up for. |
| `/close-event` | Close an event to restrict further signups (host only). |
| `/remove-user` | Remove a user from your event (host only). |
| `/give-advice` | Get random advice. |
| `/meow` | Get a random cat image. |
| `/ping` | Check the bot's latency. |
| `/rock` | Play Rock, Paper, Scissors. |
| `/paper` | Play Rock, Paper, Scissors. |
| `/scissor` | Play Rock, Paper, Scissors. |

## Getting Started

1.  **Clone the repository:** `git clone https://github.com/your-username/kohi-kitty-bot.git`
2.  **Install dependencies:** `npm install`
3.  **Configure the bot:**
      * Create a `.env` file in the root directory.
      * Add the following environment variables to the `.env` file:
        ```
        DISCORD_TOKEN=your_discord_bot_token
        CLIENT_ID=your_client_id
        KOHI_DISCORD_ID=your_guild_id
        GEMINI_API_KEY=your_gemini_api_key
        ```
4.  **Run the bot:** `node index.js`

## Contributing

Contributions are welcome\! If you have any ideas for new features, bug fixes, or improvements, please submit a pull request.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## Acknowledgements

  * [discord.js](https://discord.js.org/) - A powerful JavaScript library for interacting with the Discord API.
  * [Guild Wars 2 API](https://wiki.guildwars2.com/wiki/API:Main) - Provides access to Guild Wars 2 game data.
