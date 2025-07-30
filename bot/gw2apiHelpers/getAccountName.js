// getAccountName.js

const axios = require('axios');

/**
 * Fetches the account name associated with a given Guild Wars 2 API key.
 */
async function getAccountName(apiKey) {
    // 1. Validate input to prevent unnecessary API calls.
    if (!apiKey) {
        throw new Error('An API key must be provided.');
    }

    try {
        // 2. Make the authenticated request to the /account endpoint.
        const response = await axios.get('https://api.guildwars2.com/v2/account', {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        // 3. Return the 'name' property from the response data.
        return response.data.name;

    } catch (error) {
        // 4. Handle potential errors (e.g., invalid key, network issue)
        console.error('Error fetching account name from GW2 API:', error.message);
        // Re-throw the error so the function that called this one knows it failed.
        throw error;
    }
}

module.exports = { getAccountName };