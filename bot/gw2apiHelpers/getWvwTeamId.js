// getWvwTeamId.js

const axios = require("axios");

async function getWvwTeamId(apiKey) {

  if (!apiKey) {
    throw new Error("Please provide a valid API key.");
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

    // The API returns the team ID in the 'team' property.
    return response.data.team;

  } catch (error) {
    // Provide a more informative error message
    if (error.response) {
      console.error(
        `Error fetching WvW Team ID: Received status ${error.response.status} from API.`
      );
    } else if (error.request) {
      console.error(
        "Error fetching WvW Team ID: No response received from API."
      );
    } else {
      console.error("Error fetching WvW Team ID:", error.message);
    }

    // Re-throw the error to allow the caller to handle it
    throw error;
  }
}

module.exports = { getWvwTeamId };
