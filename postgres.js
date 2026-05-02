const { Pool } = require('pg');
require('dotenv').config();

// Initialize the connection pool using variables from your .env file
const pool = new Pool({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: String(process.env.PG_PASSWORD), // Ensures password is treated as a string
  port: process.env.PG_PORT,
});

// This is the missing piece: it exports a query function for index.js to use
module.exports = {
  query: (text, params) => pool.query(text, params),
};