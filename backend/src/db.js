const { Pool } = require('pg');

const pool = new Pool({
  host: 'postgres',
  user: 'postgres',
  password: 'password',
  database: 'chatapp',
});

module.exports = pool;

