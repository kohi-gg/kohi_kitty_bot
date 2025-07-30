# Kohi Kitty Bot 🐾

Kohi Kitty Bot is a multi-functional Discord bot designed specifically for the Guild Wars 2 community. This friendly feline bot is here to help with various tasks, from WvW role management to providing a fully automated combat log parsing service.

This repository is a **monorepo** containing all components of the Kohi Kitty Bot services:
* `./bot/` - The Node.js Discord bot and web server.
* `./uploader/` - The C# cross-platform desktop app for automatic log uploads.
* `./docs/` - Project documentation, including the full application specification.

---

## ✨ Core Features

### Arcdps Log Parser Service
The primary feature of v2.0.0 is a fully automated system for parsing and viewing `arcdps` combat logs.

* **Automated Uploads:** A lightweight desktop app monitors your log directory and automatically uploads new logs. No more dragging and dropping!
* **Instant Discord Notifications:** Get an instant summary of your encounter (success/fail, duration) posted to a server channel, with a link to the full report.
* **Interactive Web Viewer:** A clean, modern, and responsive web interface to analyze your performance with detailed tables and charts for damage, boons, and mechanics.
* **Privacy & Security Focused:** Your data is your own. The service includes features for data deletion, and the uploader app is fully open-source and verifiable.

### General Guild Features
* **WvW Team Role Assignment:** Kohi Kitty Bot can automatically assign WvW team roles to your guild members based on their GW2 API key.
* **Guild Missions and Event Reminders:** (Planned) Help your guild stay organized with timely reminders for guild missions and events.
* **Feline Fun:** Enjoy a friendly feline presence in your Discord server, with occasional cat puns and playful interactions.

---

## 🚀 Getting Started

This project is a monorepo containing two main applications: the Discord Bot and the Uploader Client.

### Running the Discord Bot

The bot is a Node.js application.

1.  **Navigate to the bot directory:**
    ```bash
    cd bot
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Configure the bot:**
    * Create a `.env` file in the `bot/` directory based on the `bot/.env.example` file.
    * Fill in the required information, including your `BOT_TOKEN`, `MONGO_URI`, etc.
4.  **Run the bot:**
    ```bash
    node index.js
    ```

### Setting up the Uploader Client

The uploader is a .NET 9 Avalonia application.

1.  **Prerequisites:** Ensure you have the .NET 9 SDK installed.
2.  **Download a Release:** Go to the [Releases](https://github.com/kohi-gg/kohi_kitty_bot/releases) page on GitHub and download the latest version for your operating system.
3.  **Configure in the App:**
    * Run the application. A configuration window will appear.
    * In your Discord server, run the `/get_upload_token` command. The bot will DM you a unique token.
    * Paste the token, the bot's API URL (e.g., `https://your-heroku-app.herokuapp.com`), and the path to your `arcdps` log directory into the configuration window.
    * Click "Save". The app will minimize to your system tray and begin monitoring for new logs.

---

## 🛡️ Is the Uploader App Safe?

**Yes.** We believe in complete transparency to ensure you can trust the software you run.

* **100% Open Source:** You can read every single line of code for the uploader in the `/uploader` directory to verify its function. It contains no keyloggers, malware, or any code that performs actions other than what is stated.
* **Minimal Scope:** The application is intentionally simple. It **only** watches the specific folder you select and **only** communicates with the bot's API endpoint you configure. It does not require administrator privileges to run.
* **Verifiable Builds:** Every official release is built automatically by GitHub Actions directly from the public source code. This creates a transparent and verifiable link between the code you see and the application you download.

---

## 🤝 Contributing

Contributions are welcome! This project follows a structured development workflow. Please see the [Application Specification](./docs/spec.md) for details on the architecture and roadmap.

If you have any ideas for new features, bug fixes, or improvements, feel free to open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License - see the `LICENSE` file for details.

## 🙏 Acknowledgements

* [discord.js](https://discord.js.org/) - A powerful JavaScript library for interacting with the Discord API.
* [Avalonia UI](https://avaloniaui.net/) - A cross-platform UI framework for .NET.
* [Guild Wars 2 API](https://wiki.guildwars2.com/wiki/API:Main) - Provides access to Guild Wars 2 game data.
