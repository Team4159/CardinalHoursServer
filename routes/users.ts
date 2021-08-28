import express from 'express';
import mysql from 'mysql';

require('dotenv').config();
const router = express.Router();
const con = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

con.connect();

const createTables = `
  CREATE TABLE IF NOT EXISTS users(
    name TEXT NOT NULL,
    password TEXT NOT NULL PRIMARY KEY,
    signedIn BOOL DEFAULT false,
    lastTime INT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions(
    password TEXT NOT NULL,
    startTime INT NOT NULL,
    endTime INT NOT NULL
  )
`;

db.exec(createTables);

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

router.post('/adduser', (req, res) => {
  const { username, password } = req.body;
  if( username === '' || password === '' ){
    res.status(400).send({
      message: "Username and password cannot be empty"
    }); 
  } else {
    const stmnt = db.prepare("INSERT INTO users(name, password, signedIn, lastTime) VALUES(?, ?, ?, ?)")
    stmnt.run(username, password, 0, Date.now());
    res.send({msg: `added new user:${username}`});
  }
});

router.post('/signin', (req, res) => {
  const getUser = db.prepare(`SELECT name, signedIn FROM users WHERE password = ?`);
  const signIn = db.prepare("UPDATE users SET lastTime = ?, signedIn = 1 WHERE password = ?");
  let user: boolean = getUser.get(req.body.password);
  if( user['signedIn'] ){
    res.status(400).send({
      message: "User already signed in"
    });
  } else {
    signIn.run(Date.now(), req.body.password);
    res.status(200).send({
      msg: `signed in user: ${user['name']}`
    });
  }
});

router.post('/signout', (req, res) => {
  const getUser = db.prepare("SELECT signedIn, lastTime FROM users WHERE password = ?");
  const signOut = db.prepare("UPDATE users SET signedIn = 0 WHERE password = ?");
  const addSession = db.prepare("INSERT INTO sessions(password, startTime, endTime) VALUES(?, ?, ?)");
  let user = getUser.get(req.body.password);
  if( user['signedIn'] ){
    signOut.run(req.body.password, );
    addSession.run(req.body.password, user['lastTime'], Date.now());
    res.status(200).send({
      msg: `signed in user: ${user['name']}`
    });
  } else {
    res.status(400).send({
      message: "User not signed in"
    });
  }
});

router.get('/all', (req, res) => {
  const stmnt = db.prepare("SELECT * FROM users")
  const users = stmnt.all()
  res.send(users)
})

router.get('/user/:username', (req, res) => {
  const stmnt = db.prepare("SELECT * FROM users WHERE name = ?")
  const { username } = req.params
  const userData = stmnt.get(username)
  res.send(userData)
})

router.get('/delete/:username', (req,res) => {
  const stmnt = db.prepare("DELETE FROM users WHERE name = ?"), {username} = req.params
  stmnt.run(username)
  res.send(`Deleted user: ${username}`)
})
router.get('/update/:username', (req,res) => {
  const sql:string = "UPDATE users SET name = ? WHERE name = ?"
  const stmnt = db.prepare(sql)
  stmnt.get()
  res.send(`Updated user ${req.params.username}`)
})
router.get('/update/:password', (req, res, next) => {

})

const isDuplicateUsername = (username) => {
  const stmnt = db.prepare("SELECT name FROM users"), usernames = stmnt.all()
  for(let i = 0; i<usernames.length; i++) 
    if(username === usernames[i]) return true
  return false
}

module.exports = router;
