import mysql from 'mysql-await';
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

pool.getConnection(function(err, conn) {
  if (err) throw err;
  console.log('connected as id ' + conn.threadId);
})

exports.db = pool;
