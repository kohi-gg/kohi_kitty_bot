const pool = require('./db');

async function fetchUserData() {
    try {
        const result = await pool.query('SELECT * FROM user_api_keys;');
        //console.log(result.rows);
        return result.rows;
        
    } catch (error) {
        console.error('Error fetching user data:', error);
        throw error;
    }
}

module.exports = { fetchUserData };