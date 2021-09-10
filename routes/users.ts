import mysql from 'mysql-await';
import Router from 'express-promise-router';
var database = require('../db');
const router = Router();

const db = database.db;

const createUserTable: string = `
  CREATE TABLE IF NOT EXISTS users(
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    name TEXT NOT NULL,
    password VARCHAR(300) NOT NULL UNIQUE,
    signedIn BOOL DEFAULT false,
    lastTime BIGINT NOT NULL
  )
`;

const createSessionTable: string = `
  CREATE TABLE IF NOT EXISTS sessions(
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    password VARCHAR(300) NOT NULL,
    startTime BIGINT NOT NULL,
    endTime BIGINT NOT NULL
  )
`;

db.query(createUserTable, function (err, res) {
  if (err) throw err;
  if(res.warningCount !== 0)
    console.log("User table already exists");
  else
    console.log("Created new user table");
});

db.query(createSessionTable, function (err, res) {
  if (err) throw err;
  if(res.warningCount !== 0)
    console.log("Session table already exists");
  else
    console.log("Created new session table");
});

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

router.post('/adduser', async (req, res, next) => {
  const con = await db.awaitGetConnection();
  await con.awaitBeginTransaction();
  const { username, password }: { username: string, password: string } = req.body;

  if( username === undefined || password === undefined || username == "" || password == "" ){
    res.status(400).send("Username or password cannot be empty"); 
    return;
  }

  const addUser: string = "INSERT INTO users(name, password, signedIn, lastTime) VALUES(?, ?, ?, ?)";
  con.query(mysql.format(addUser, [username, password, 0, Date.now()]), function (error, response) {
    if (error) {
      if(error.errno === 1062){
        con.awaitRollback();
        res.status(400).send('User already exists');
        return;
      }
      else {
        con.awaitRollback();
        console.log(error);
        res.status(500).send('Something went wrong');
        return;
      }
    } else {
      con.awaitCommit();
      console.log(`Added new user: ${username}, ${password}`);
      res.status(200).send(`Added new user: ${username}, password: ${password}`);
    }
  });

  con.release();
});

router.post('/signin', async (req, res, next) => {
  const con = await db.awaitGetConnection();
  await con.awaitBeginTransaction();
  const getUser = "SELECT name, signedIn FROM users WHERE password = ?";
  const signIn = "UPDATE users SET lastTime = ?, signedIn = 1 WHERE password = ?";

  var user = await db.awaitQuery(mysql.format(getUser, [req.body.password]));
  if( user.length === 0 ){
    con.awaitRollback();
    res.status(404).send(`User not found`);
    return;
  }

  if( user[0]['signedIn'] === 1 ){
    con.awaitRollback();
    res.status(400).send("User already signed in");
    return;
  }

  con.query(mysql.format(signIn, [Date.now(), req.body.password]), function (error, response) {
    if (error) {
      con.awaitRollback();
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    } else {
      con.awaitCommit();
      res.status(200).send(`Signed in user: ${user[0]['name']}`);
    }
  });

  con.release();
});

router.post('/addsession', async (req, res, next) => {
  const con = await db.awaitGetConnection();
  await con.awaitBeginTransaction();
  const getUser = "SELECT name, signedIn, lastTime FROM users WHERE password = ?";
  const addSession = "INSERT INTO sessions(password, startTime, endTime) VALUES(?, ?, ?)";

  var user = await db.awaitQuery(mysql.format(getUser, [req.body.password]));
  if( user.length === 0 ){
    con.awaitRollback();
    res.status(404).send(`User not found`);
    return;
  }

  con.query(mysql.format(addSession, [req.body.password, req.body.startTime, req.body.endTime]), function (error, response) {
    if (error) {
      con.awaitRollback();
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    } else {
      con.awaitCommit();
      res.status(200).send(`Added session for user: ${user[0]['name']}`);
    }
  });
  con.release();
});

router.post('/signout', async (req, res, next) => {
  const con = await db.awaitGetConnection();
  await con.awaitBeginTransaction();
  const getUser = "SELECT name, signedIn, lastTime FROM users WHERE password = ?";
  const signOut = "UPDATE users SET signedIn = 0 WHERE password = ?";
  const addSession = "INSERT INTO sessions(password, startTime, endTime) VALUES(?, ?, ?)";

  var user = await db.awaitQuery(mysql.format(getUser, [req.body.password]));
  if( user.length === 0 ){
    con.awaitRollback();
    res.status(404).send(`User not found`);
    return;
  }

  if( user[0]['signedIn'] === 0 ){
    con.awaitRollback();
    res.status(400).send("User not signed in");
    return;
  }

  con.query(mysql.format(signOut, [req.body.password]), function (error, response) {
    if (error) {
      con.awaitRollback();
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    }
  });

  con.query(mysql.format(addSession, [req.body.password, user[0]['lastTime'], Date.now()]), function (error, response) {
    if (error) {
      con.awaitRollback();
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    } else {
      con.awaitCommit();
      res.status(200).send(`Signed out user: ${user[0]['name']}`);
    }
  });

  con.release();
});

router.post('/changeSessionTime', async (req, res, next) => {
  
});

router.get('/getusersessions', async (req, res, next) => {
  const getUser = "SELECT name FROM users WHERE password = ?";

  var user = await db.awaitQuery(mysql.format(getUser, [req.query.password]));
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  const getUserSessions = "SELECT id, startTime, endTime FROM sessions WHERE password = ?";
  db.query(mysql.format(getUserSessions, [req.query.password]), function (error, response) {
    if (error) {
      console.log(error);
      res.status(500).send('Something went wrong');
    }
    var formatted = [];
    response.forEach( session => {
      formatted.push(
        {
          "id": session['id'],
          "startTime": session['startTime'],
          "endTime": session['endTime']
        }
      )
    });
    res.json(formatted);
  });
});

router.get('/getuserdata', async (req, res, next) => {
  const getUser = "SELECT name, signedIn, lastTime FROM users WHERE password = ?";

  var user = await db.awaitQuery(mysql.format(getUser, [req.query.password]));
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  const getUserTime = "SELECT SUM(endTime - startTime) AS DIFF FROM sessions WHERE password = ?";
  db.query(mysql.format(getUserTime, [req.body.password]), function (error, response) {
    if (error) {
      console.log(error);
      res.status(500).send('Something went wrong');
    }
    res.json({
      "name": user[0]['name'],
      "signedIn": user[0]['signedIn'],
      "totalTime": response[0]['DIFF'] ?? 0
    });
  });
});

router.get('/getusers', async (req, res, next) => {
  const getSignedIn = "SELECT id, name, signedIn, lastTime FROM users";
  var users = [];
  db.query(mysql.format(getSignedIn), function (error, response) {
    if (error) {
      console.log(error);
      res.status(500).send('Something went wrong');
    }

    response.forEach( session => {
      users.push({
        "id": session['id'],
        "name": session['name'],
        "signedIn": session['signedIn'],
        "timeIn": Date.now() - session['lastTime']
      })
    });

    res.json(users);
  });
});

module.exports = router;
