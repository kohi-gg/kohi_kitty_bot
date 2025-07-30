# Application Specification: Kohi Kitty Bot - Arcdps Log Parser

**Version:** 2.0.0
**Date:** July 30, 2025
**Author:** The creators of Kohi Kitty Bot

## 1. Project Overview & Vision

### 1.1. Project Name

**Kohi Kitty Bot - Arcdps Log Parser Services**

### 1.2. Purpose & Vision

The project aims to create a seamless, automated system for Guild Wars 2 players to parse and view their `arcdps` combat logs (`.evtc` files). The core experience revolves around the **Kohi Kitty Bot**, which automates the log uploading and parsing process, presenting the results in a clean, user-friendly web interface. The vision is to provide a "fire-and-forget" tool that requires minimal user interaction after initial setup, delivering valuable combat insights directly within the user's community hub (Discord).

### 1.3. Target Audience

* **Raid Statics & Training Groups:** Teams who need to review performance, check boon uptimes, and analyze mechanics for improvement.
* **Guilds:** For sharing successful clears, tracking member performance, and fostering a collaborative environment.
* **Individual Players:** Players who want a quick and easy way to analyze their personal performance without navigating external websites.

### 1.4. Core Components

1.  **Discord Bot (The Controller):** A Node.js application (`Kohi Kitty Bot`) that serves as the central hub. It handles all user interaction within Discord, manages the backend API, processes the data pipeline, and communicates with the database.
2.  **Web Viewer (The Frontend):** A single-page HTML application, served by the bot's Express server. It is a "dumb" client responsible only for fetching pre-parsed data from the backend and rendering it in a visually appealing and interactive format.
3.  **Uploader Client (Helper App):** A lightweight C#/.NET 9 desktop application using Avalonia UI. Its sole purpose is to monitor the user's local `arcdps` log directory and automatically upload new log files to the Bot's API endpoint, making the entire process seamless.

## 2. Architecture & User Flow

### 2.1. System Architecture

The system uses a client-server model. The **Kohi Kitty Bot** acts as the server, exposing a web API. The **Uploader Client** and the **Web Viewer** act as clients. The entire system is designed to be hosted within a single Heroku application for simplicity and cost-effectiveness.

### 2.2. Detailed User Flow

1.  **First-Time Server Setup (Admin Task):**
    a.  A server admin adds the `Kohi Kitty Bot` to their Discord server.
    b.  The admin runs the `/setup_log_channel` command, selecting a channel where all logs for the server will be posted. The bot saves this preference to the `guildConfigs` collection in MongoDB.

2.  **First-Time Uploader Setup (User Task):**
    a.  In the Discord server, the user runs the `/get_upload_token` command. The bot generates a unique, secure token and DMs it to the user. This token is linked to the user's ID and the server's ID.
    b.  User downloads the `KohiLogUploader.zip` from the project's GitHub Releases page.
    c.  User unzips and runs the `KohiLogUploader` executable.
    d.  A simple configuration window appears, asking for:
    i.  **API Endpoint URL:** (e.g., `https://kohi-kitty-bot.herokuapp.com`).
    ii. **Upload Token:** The user pastes the token they received from the bot.
    iii. **Log Directory Path:** (A "Browse..." button will open a folder picker dialog).
    e.  The user clicks "Save". The application minimizes to the system tray and begins monitoring.

3.  **Automatic Log Processing:**
    a.  The user finishes a GW2 encounter, and `arcdps` creates a new `.evtc` file.
    b.  The Uploader Client's `FileSystemWatcher` detects the new file and, after a short delay, sends it via an HTTP POST request to the bot's `/upload/:token` endpoint.
    c.  The bot's Express server receives the file. It validates the token by looking it up in the `uploadTokens` collection to retrieve the associated `userId` and `guildId`.
    d.  The bot's **simulated parsing logic** generates a structurally-correct JSON object.
    e.  The bot saves the JSON object to the `logs` collection in MongoDB.
    f.  The bot queries the `guildConfigs` collection using the `guildId` from the token to find the correct channel to post in.
    g.  The bot constructs and sends a Rich Embed message to the configured channel, pinging the `userId` and including a link to the Web Viewer (`https://<bot-url>/viewer.html#<log_id>`).

4.  **Viewing the Report:**
    a.  The user clicks the link in Discord.
    b.  The Web Viewer page loads, shows a loading spinner, and extracts the `log_id` from the URL fragment.
    c.  The viewer's JavaScript makes a `fetch` request to the bot's `GET /api/log/:logId` endpoint.
    d.  The bot retrieves the corresponding document from MongoDB and returns it as JSON.
    e.  The viewer parses the JSON and dynamically renders the data.

## 3. Component Deep Dive: UI & Technology Stacks

This section explicitly details the user interface and the full required technology stack for each of the three core components of the service.

### 3.1. Component 1: Kohi Kitty Bot (The Backend & Controller)

* **Primary Repository Location:** `bot/`
* **User Interface:**
    * **Slash Commands:**
        * `/setup_log_channel channel:[channel]` **(Admin Only):** Sets the log channel for the entire server.
        * `/get_upload_token`: Generates a unique upload token for the user, specific to the server it's used in, and sends it via DM.
        * `/help`: Displays information about the bot and its commands.
        * `/delete_my_data`: A command with a confirmation step to erase all logs uploaded by the user.
    * **Rich Embeds:** All bot responses will use `EmbedBuilder` for a clean look.
* **Technology Stack & Libraries:**
    * **Runtime:** Node.js v20.x
    * **Discord API:** `discord.js` (v14.x)
    * **Web Server:** `express` (v4.x)
    * **File Upload Handling:** `multer`
    * **Database Driver:** `mongodb` (v6.x)
    * **Configuration:** `dotenv`
    * **Utilities:**
        * `express-rate-limit`
        * `cors`

### 3.2. Component 2: The Web Viewer (The Frontend)

* **Primary Repository Location:** `bot/public/`
* **User Interface & Design:**
    * **Layout:** A modern, responsive, single-column layout that adapts cleanly from desktop to mobile. It will feature a header, a main content area, and a footer.
    * **Styling:** **Tailwind CSS** will be used for all styling.
        * **Font:** Inter (loaded from Google Fonts).
        * **Theme:** A light theme with a neutral gray background (`bg-gray-100`), white content cards (`bg-white`), and blue accent colors (`bg-blue-600`) for interactive elements.
        * **Components:** Elements will have rounded corners (`rounded-lg`) and soft shadows (`shadow-md`) for a modern feel.
    * **Interactivity:**
        * **Tabs:** The main data view will be controlled by tabs ("Damage", "Boons", "Mechanics", "Graphs"). Clicking a tab will dynamically render the content for that view without a page refresh.
        * **Charts:** **Chart.js** will be used to render a vertical bar chart for DPS and a radar chart for boon coverage. Charts will be animated and responsive.
        * **Loading/Error States:** The page will initially display a CSS-animated spinner. If an API call fails or a log is not found, the spinner will be replaced with a clear, user-friendly error message.
* **Technology Stack & Libraries:**
    * **Core:** HTML5, CSS3, modern JavaScript (ES Modules).
    * **CSS Framework:** `tailwindcss` (v3.x) (CDN).
    * **Charting Library:** `chart.js` (v3.x) (CDN).

### 3.3. Component 3: The Uploader Client (The Helper App)

* **Primary Repository Location:** `uploader/`
* **User Interface (Avalonia UI):**
    * **Pattern:** MVVM using `CommunityToolkit.Mvvm`.
    * **Configuration Window:** A single, non-resizable window with `TextBox` controls for API URL and **Upload Token**, a `Button` for "Browse...", and a `TextBlock` for status updates.
        * **Status Label States:**
            * `Initializing...`
            * `Monitoring for logs in [folder path]...`
            * `New log detected: [filename]. Uploading...`
            * `Upload successful! View report: [link]`
            * `Upload failed. Retrying in X seconds...`
            * `Error: [error message]. Please check logs.`
    * **Styling:** Default "Fluent" theme.
    * **System Tray Icon** with context menu.
* **Technology Stack & Libraries:**
    * **Framework:** .NET 9
    * **UI Framework:** `Avalonia` (v11.x)
    * **File System Monitoring:** `System.IO.FileSystemWatcher`
    * **HTTP Communication:** `System.Net.Http.HttpClient`
    * **MVVM Toolkit:** `CommunityToolkit.Mvvm`
    * **Configuration Management:** `System.Text.Json`
    * **Logging:** `Serilog`
    * **Reactive Programming:** `System.Reactive`

## 4. Detailed Feature Set & Roadmap

### 4.1. Initial Release Features

#### Discord Bot (`Kohi Kitty Bot`)

* **Commands:** Includes the new `/setup_log_channel` (Admin) and `/get_upload_token` commands. The `/my_info` command is removed as settings are no longer per-user.
* **API:** The `POST /upload/:userId` endpoint is changed to `POST /upload/:token`.
* **Core Logic:** Includes logic to validate tokens and look up guild-based configurations.

#### Web Viewer & Uploader Client

* Features for the Web Viewer and Uploader Client remain as defined in Section 3, with the notable change that the Uploader Client will require an **Upload Token** instead of a Discord User ID for its configuration.

### 4.2. Future Roadmap

* **Real EVTC Parsing:** Replace the simulation with a real binary parsing library.
* **Historical Analysis:** A new `/stats` command to show a user's performance trends.
* **Guild-wide Leaderboards:** Opt-in system for guilds to create weekly performance leaderboards.
* **Advanced Analytics:** Player-to-player comparisons within a single log.
* **Uploader Auto-Update:** Implement a mechanism for the C# client to check for new releases on GitHub and prompt the user to update.

## 5. Data Models (MongoDB)

### 5.1. `guildConfigs` Collection

Stores the channel configuration for each server.

* **Primary Key:** `_id` (Discord Guild ID)
  **Example Document:**
    ```json
    {
      "_id": "555666777888999000",
      "logChannelId": "987654321098765432"
    }
    ```

### 5.2. `uploadTokens` Collection

Stores unique, user-specific tokens for uploading.

* **Primary Key:** `_id` (The secure token string)
  **Example Document:**
    ```json
    {
      "_id": "aSecureRandomTokenString_12345",
      "userId": "123456789012345678",
      "guildId": "555666777888999000",
      "createdAt": "2025-06-25T12:00:00Z"
    }
    ```

### 5.3. `logs` Collection

Stores the parsed data from each uploaded log file.

* **Primary Key:** `_id` (Auto-generated ObjectId)

**Example Document:**
```json
{
  "_id": "62b7e9d8a1b2c3d4e5f6a7b8",
  "uploadedBy": "123456789012345678",
  "uploadedAt": "2025-06-25T12:00:00Z",
  "guildId": "555666777888999000",
  "encounter": {
    "name": "Prototype X",
    "fileName": "20250625-120000.evtc",
    "success": true,
    "durationMs": 185000,
    "target": {
      "name": "Prototype X",
      "totalHealth": 22021440,
      "finalHealthPercent": 0
    }
  },
  "players": [
    {
      "name": "Player.1234",
      "account": "SomeUser.1234",
      "profession": "Firebrand",
      "subgroup": 1,
      "dps": 42000,
      "boons": {
        "might": 99.5,
        "fury": 100,
        "quickness": 98.2,
        "alacrity": 0,
        "protection": 85.1
      }
    }
  ],
  "mechanics": [
    {
      "name": "Green Circle Fail",
      "count": 3,
      "players": {
        "Player.5678": 2,
        "Player.9012": 1
      }
    }
  ]
}
```

## 6. API Endpoint Definitions

### `POST /upload/:token`

* **Description:** Receives a single log file for processing using a secure token.
* **URL Params:**
    * `token` (string, required): The unique upload token provided to the user.
* **Request Body:** `multipart/form-data` with the `logFile`.
* **Success Response (200 OK):** `{"message": "Log processed...", "logId": "..."}`
* **Error Responses:** `400 Bad Request`, `401 Unauthorized` (if token is invalid), `500 Internal Server Error`.

### `GET /api/log/:logId`

* **Description:** Retrieves a single parsed log document for the web viewer.
* **URL Params:**
    * `logId` (string, required): The MongoDB ObjectId of the log.
* **Success Response (200 OK):** The full JSON document from the `logs` collection.
* **Error Response (404 Not Found):** If no log with the given ID exists.

## 7. Security & Error Handling

### 7.1. Security

* **API Authentication:** The system is upgraded from a trust-based user ID to a secure, unique token per user, per guild. This prevents users from uploading logs "as" someone else and provides clear context for each upload.
* **Environment Variables & Database Access:** All sensitive information **must** be stored in environment variables. The Heroku server's IP address should be whitelisted in MongoDB Atlas.

### 7.2. Error Handling

* **Uploader Client:** Will log errors to a local text file. Will handle network disconnects by implementing an exponential backoff retry strategy.
* **Discord Bot:** All major operations will be wrapped in `try...catch` blocks. Critical errors will be logged to a private admin channel in Discord.
* **Web Viewer:** Will display user-friendly messages for network errors or if a log is not found.

## 8. Repository & Deployment

### 8.1. Repository Structure (Monorepo)

The project will be housed in a single GitHub repository (`kohi-gg/kohi_kitty_bot`) to simplify management and maintain tight coupling between the bot and the uploader client.

```
/kohi_kitty_bot/
|
|-- .github/                # GitHub Actions workflows for CI/CD
|-- .gitignore              # Handles both Node.js and .NET files
|-- README.md               # Main project README
|
|------------------------------------
|-- bot/                    # All Node.js bot and web viewer code
|   |
|   |-- public/             # Static files for the Web Viewer
|   |   |-- viewer.html     # The single-page application
|   |   |-- (assets like css, images if any)
|   |
|   |-- src/                # The bot's source code
|   |   |-- commands/       # Slash command handlers
|   |   |-- ...
|   |
|   |-- index.js            # Main bot entry point (includes Express server)
|   |-- package.json
|   |-- .env.example        # Example environment file
|
|------------------------------------
|-- uploader/               # All C# Uploader Client code
|   |
|   |-- KohiLogUploader.sln   # The Visual Studio Solution file
|   |-- KohiLogUploader/      # The C# project folder
|   |   |-- KohiLogUploader.csproj
|   |   |-- Program.cs
|   |   |-- ... (other .cs files)
|
|------------------------------------
|-- docs/                   # Project documentation
    |-- spec.md             # This specification document
```

### 8.2. Deployment (CI/CD)

* A `Procfile` will define the Heroku web process: `web: node bot/index.js`.
* **GitHub Actions** will be configured with two distinct workflows:
    1.  **`deploy-bot.yml` (On push to `main`):**
        a. `actions/checkout@v4`
        b. `actions/setup-node@v4` with Node.js 20.x.
        c. `npm install` within the `bot/` directory.
        d. `heroku/deploy@v7` to deploy the contents of the `bot/` directory to the Heroku app.
    2.  **`release-uploader.yml` (On creating a tag like `v*.*.*`):**
        a. `actions/checkout@v4`
        b. `actions/setup-dotnet@v4` with .NET 9.
        c. `dotnet publish` on the `uploader/KohiLogUploader.csproj` in `Release` mode for `win-x64`, `linux-x64`, and `osx-x64`.
        d. `actions/create-release@v1` to create a draft GitHub Release.
        e. `actions/upload-release-asset@v1` to zip the published artifacts for each platform and attach them to the created release.

## 9. User Trust & Application Security

This section outlines the project's policies and technical design choices aimed at ensuring the Uploader Client is safe, transparent, and trustworthy for all users.

### 9.1. Commitment to Open Source

**Radical Transparency** is the cornerstone of our security policy.
* **100% Open Source:** The entire codebase for all components, including the Uploader Client, is publicly available in the `kohi-gg/kohi_kitty_bot` GitHub repository. Users are encouraged to inspect the code to verify its functionality.
* **No Obfuscation:** The released binaries will not be obfuscated, ensuring that the compiled code corresponds directly to the public source code.

### 9.2. Minimal Application Scope & Permissions

The Uploader Client is intentionally designed with the absolute minimum functionality and system access required to perform its task.
* **Strictly Limited File Access:** The application uses the standard `.NET FileSystemWatcher`, which is sandboxed to **only** monitor the specific log directory explicitly chosen by the user. It does not have the ability to read, write, or even be aware of any other files or directories on the user's system.
* **Singular Network Communication:** The application uses the standard `.NET HttpClient` to send files **only** to the bot's API endpoint URL configured by the user. It does not and cannot communicate with any other servers.
* **No Special Permissions Required:** The application is designed to run without requiring administrator privileges, operating within standard user-level permissions.

### 9.3. Verifiable & Automated Builds

Users must be able to trust that the application they download is a direct, unmodified build of the public source code.
* **Automated CI/CD Pipeline:** Every official release of the Uploader Client is compiled and packaged automatically by GitHub Actions. This process is defined in the public `.github/workflows/release-uploader.yml` file.
* **Verifiable Link:** This automated pipeline creates a transparent and verifiable link between the source code and the downloadable release assets. Users can trace the build logs for any release to confirm its origin.

### 9.4. Future Security Goals (Code Signing)

To further enhance user trust and provide a smoother installation experience on Windows, a future goal for the project is to obtain and implement an Authenticode certificate.
* **Digital Signature:** Signing the Uploader Client's executable will verify "Kohi Kitty Bot" as the publisher.
* **Windows Defender SmartScreen:** A valid signature will help build a positive reputation with Windows Defender, reducing or eliminating security warnings for users during download and execution. This will be prioritized as the user base grows.

## 10. Project Policies & Configuration

### 10.1. Environment Configuration

The bot's `.env` file must contain the following keys for the application to function correctly:

* `BOT_TOKEN`: The Discord bot token.
* `MONGO_URI`: The full connection string for the MongoDB Atlas database.
* `CLIENT_ID`: The Discord Application/Client ID for registering slash commands.
* `API_BASE_URL`: The public base URL of the Heroku app (e.g., `https://kohi-kitty-bot.herokuapp.com`).
* `ADMIN_LOG_CHANNEL_ID`: The Discord channel ID for posting critical error logs.

### 10.2. Data Privacy & Retention Policy

* **Data Retention:** User-uploaded logs and user configuration data are stored indefinitely to allow for historical analysis. This policy will be clearly stated in the `/help` command response.
* **Data Deletion:** The `/delete_my_data` command remains for users to delete their uploaded logs. An admin-only command, `/clear_log_channel`, will be added to remove the server's configuration from the `guildConfigs` collection.

### 10.3. Testing Strategy

* **Bot / Backend:**
    * **Unit Tests:** Jest will be used to test individual, pure functions (e.g., data formatting utilities, simulated parsing logic).
    * **Integration Tests:** Supertest will be used to test the Express API endpoints to ensure they handle valid requests, file uploads, and error states correctly.
* **Uploader Client:**
    * **Unit Tests:** xUnit or NUnit will be used to test the ViewModels and services (e.g., configuration manager, API client) to verify their logic without involving the UI.
* **End-to-End (E2E):** Manual testing will be performed for the full user flow before each release.
