const { Pool } = require('pg');

const pool = new Pool({
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWD || '',
  database : process.env.DB_NAME
});

module.exports = pool;

