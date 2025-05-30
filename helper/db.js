const { Client } = require('pg');
const mongoose = require("mongoose");
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

(async () => {
  try {
    await pool.connect();
    console.log('Connected to Avien PostgreSQL!');
  } catch (error) {
    console.error('Error connecting to Avien PostgreSQL:', error);
    process.exit(1); // Exit the process if the database connection fails
  }
//connect to mongoose
  await mongoose.connect(process.env.MONGO_URI || '');
  /**The `useNewUrlParser` and `useUnifiedTopology` options were introduced in older versions of the MongoDB Node.js driver to address compatibility issues. 
   * However, these options are no longer necessary with the newer driver versions (4.0.0 and above). */
  
  if(mongoose.connect){
    console.log('connected to mongoose');
  }else(
    console.log("Cannot connect to mongoose right now ..")
  )
})();

module.exports = pool;