const pool = require('./db');

async function storeTuna(money, daily) {
  try {
    await pool.query(
      'INSERT INTO tuna (userName, userID, money, daily) VALUES ($1, $2, $3, $4)',
      [userName, userID, money + 5, daily]
    );
    console.log(`added to tuna table ${userName} ${money}`);
  } catch (error) {
    console.error('Error storing Balance in database:', error);
    throw error;
        } 
    }

module.exports = { storeTuna };