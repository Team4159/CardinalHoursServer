var express = require('express');
var router = express.Router();
import Database from 'better-sqlite3';
const db = new Database('foobar.db', { verbose: console.log });

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.get('/add', function(req, res, next) {
  const createTable = db.prepare("CREATE TABLE IF NOT EXISTS cats ('id' INT, 'name' VARCHAR, 'age' INT);");
  const insert = db.prepare('INSERT INTO cats (name, age) VALUES (@name, @age)');
  createTable.run();

});

module.exports = router;
