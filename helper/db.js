const { Client } = require('pg');
require('dotenv').config({ path: './.env' });

const pool = new Client({
  user: process.env.AVIEN_DB_USER,
  host: process.env.AVIEN_DB_HOST,
  database: process.env.AVIEN_DB_NAME,
  password: process.env.AVIEN_DB_PASSWORD,
  port: 12436,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.AVIEN_SSL_CERT
  },
});

let isConnected = false; // Flag to track connection status

async function connectToDB() {
  try {
    await pool.connect();
    isConnected = true;
    console.log('Connected to Avien PostgreSQL!');
  } catch (error) {
    isConnected = false;
    console.error('Error connecting to Avien PostgreSQL:', error);
    // Retry connection after a delay (e.g., 5 seconds)
    setTimeout(connectToDB, 5000); 
  }
}

connectToDB(); // Initial connection attempt

// Disconnect after 5 minutes of inactivity
let timeoutId;

function resetIdleTimeout() {
  clearTimeout(timeoutId);
  timeoutId = setTimeout(async () => {
    try {
      await pool.end();
      isConnected = false;
      console.log('Disconnected from Avien PostgreSQL due to inactivity.');
    } catch (error) {
      console.error('Error disconnecting from Avien PostgreSQL:', error);
    }
  }, 5 * 60 * 1000); // 5 minutes in milliseconds
}

// Reset the timeout on any database activity
pool.on('query', () => {
  resetIdleTimeout();
  if (!isConnected) { 
    connectToDB(); // Reconnect if not connected
  }
});

// Initial timeout setup
resetIdleTimeout();

module.exports = pool;