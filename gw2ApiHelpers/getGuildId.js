// getGuildId.js

const axios = require("axios");
//require("dotenv").config({ path: "./.env" });


async function getGuildId(apiKey) {


  if (!apiKey) {
    throw new Error("API_KEY is not defined in your environment variables.");
  }

  try {
    const response = await axios.get(
      "https://api.guildwars2.com/v2/account/wvw",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    // The API returns the guild ID in the 'guild' property.
    // It can be a string or null if no guild is selected for WvW.
    const guildId = response.data.guild;

    return guildId;
  } catch (error) {
    // Provide a more informative error message
    if (error.response) {
      console.error(
        `Error fetching Guild ID: Received status ${error.response.status} from API.`
      );
    } else if (error.request) {
      console.error("Error fetching Guild ID: No response received from API.");
    } else {
      console.error("Error fetching Guild ID:", error.message);
    }

    // Re-throw the error to allow the caller to handle it
    throw error;
  }
}

module.exports = { getGuildId };
