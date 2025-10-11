// gw2ApiHelpers/validateApi.js

const axios = require('axios');

/**
 * Validates a Guild Wars 2 API key for length and required scopes ('account', 'wvw').
 */
async function validateApi(apiKey) {
    // 1. Synchronous validation for format and length first.
    if (typeof apiKey !== 'string' || apiKey.length !== 72) {
        throw new Error('Invalid API key format. It must be a 72-character string.');
    }

    try {
        // 2. Use Promise.all to make API calls concurrently for efficiency.
        //    We check endpoints that require the specific scopes we need.
        await Promise.all([
            axios.get('https://api.guildwars2.com/v2/account', {
                headers: { Authorization: `Bearer ${apiKey}` },
            }),
            axios.get('https://api.guildwars2.com/v2/account/wvw', {
                headers: { Authorization: `Bearer ${apiKey}` },
            }),
        ]);

        // 3. If both promises resolve, the key is valid and has the required scopes.
        return true;

    } catch (error) {
        // 4. Consolidated error handling.
        if (error.response) {
            const status = error.response.status;
            if (status === 401) { // 401 Unauthorized
                throw new Error('This API key is invalid. Please check the key and try again.');
            }
            if (status === 403) { // 403 Forbidden
                // It's better to give a single, comprehensive scope error.
                throw new Error('Your API key is missing required permissions. Please create an [ArenaNet API Key](<https://account.arena.net/applications/create>) with `account`, `guilds`, and `wvw` scopes checked.');
            }
            if (status === 503) { // 503 Service Unavailable
                throw new Error('The Guild Wars 2 API is currently unavailable (Status 503). Please try again later.');
            }
            // Handle other potential server errors
            throw new Error(`The Guild Wars 2 API returned an error (Status ${status}). Please check your API again.`);
        }

        // Handle network errors where there is no response object
        throw new Error('Could not connect to the Guild Wars 2 API. Please check your network connection.');
    }
}

module.exports = { validateApi };