const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: './.env' });

const pool = new Client({
  user: process.env.AVIEN_DB_USER,
  host: process.env.AVIEN_DB_HOST,
  database: process.env.AVIEN_DB_NAME,
  password: process.env.AVIEN_DB_PASSWORD,
  port: 12436,
  ssl: {
    rejectUnauthorized: false,
    ca: fs.readFileSync('./avien.pem').toString()
  },
});

(async () => {
  try {
    await pool.connect();
    console.log('Connected to Avien PostgreSQL!');

  } catch (error) {
    console.error('Error connecting to Avien PostgreSQL:', error);
    process.exit(1); // Exit the process if the database connection fails
  }
})();


// Disconnect after 10 minutes of inactivity
let timeoutId;

function resetIdleTimeout() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    try {
      await pool.end();
      console.log('Disconnected from Avien PostgreSQL due to inactivity.');
    } catch (error) {
      console.error('Error disconnecting from Avien PostgreSQL:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
}

// Reset the timeout on any database activity
pool.on('query', resetIdleTimeout);

// Initial timeout setup
resetIdleTimeout();


module.exports = pool;