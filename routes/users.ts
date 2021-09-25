import mysql from 'mysql2';
import Router from 'express-promise-router';
var database = require('../db');
const router = Router();

const {Caching, HashTypes} = require('../db');

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

const getUser = "SELECT id, name, signedIn, lastTime FROM users WHERE password = BINARY ?";
const getUserSessions = "SELECT id, startTime, endTime FROM sessions WHERE password = BINARY ?";
const getUsers = "SELECT id, name, password, signedIn, lastTime FROM users";
const getSessions = "SELECT password, startTime, endTime FROM sessions";

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
  const { username, password }: { username: string, password: string } = req.body;

  if( username === undefined || password === undefined || username == "" || password == "" ){
    res.status(400).send("Username or password cannot be empty"); 
    return;
  }

  const addUser: string = "INSERT INTO users(name, password, signedIn, lastTime) VALUES(?, ?, ?, ?)";
  db.query(mysql.format(addUser, [username, password, 0, Date.now()]), {caching: Caching.SKIP})
    .then(response => {
      refreshUsersCache();
      console.log(`Added new user: ${username}, ${password}`);
      res.status(200).send(`Added new user: ${username}, password: ${password}`);
      return;
    })
    .catch(error => {
      if(error.errno === 1062){
        res.status(400).send('User already exists');
        return;
      }
      else {
        console.log(error);
        res.status(500).send('Something went wrong');
        return;
      }
    });
});

router.post('/signin', async (req, res, next) => {
  const signIn = "UPDATE users SET lastTime = ?, signedIn = 1 WHERE password = BINARY ?";

  var user = (await db.query(mysql.format(getUser, [req.body.password]), {caching: Caching.SKIP}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  if( user[0]['signedIn'] === 1 ){
    res.status(400).send("User already signed in");
    return;
  }

  db.query(mysql.format(signIn, [Date.now(), req.body.password]), {caching: Caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshUsersCache();
      res.status(200).send(`Signed in user: ${user[0]['name']}`);
      return;
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

router.post('/addsession', async (req, res, next) => {
  const con = await db.getConnection();
  const addSession = "INSERT INTO sessions(password, startTime, endTime) VALUES(?, ?, ?)";

  var user = (await db.query(mysql.format(getUser, [req.query.password]), {hash: "getUser"}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  con.query(mysql.format(addSession, [req.body.password, req.body.startTime, req.body.endTime]), {caching: Caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshSessionsCache();
      res.status(200).send(`Added session for user: ${user[0]['name']}`);
      return;
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

router.post('/signout', async (req, res, next) => {
  const signOut = "UPDATE users SET signedIn = 0 WHERE password = BINARY ?";
  const addSession = "INSERT INTO sessions(password, startTime, endTime) VALUES(?, ?, ?)";

  var user = (await db.query(mysql.format(getUser, [req.body.password]), {caching: Caching.SKIP}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  if( user[0]['signedIn'] === 0 ){
    res.status(400).send("User not signed in");
    return;
  }

  db.query(mysql.format(signOut, [req.body.password]), {caching: Caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshUsersCache();
      return;
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    });

  db.query(mysql.format(addSession, [req.body.password, user[0]['lastTime'], Date.now()]), {caching: Caching.SKIP})
    .then(response => {
      refreshSessionsCache();
      res.status(200).send(`Signed out user: ${user[0]['name']}`);
      return;
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
  });
});

function refreshUserCache(password){
  db.query(mysql.format(getUser, [password]), {hash: "getUser", caching: Caching.REFRESH})
    .catch(error => {
      console.log(error);
      return;
    });

  db.query(mysql.format(getUserSessions, [password]), {hash: "getUserSessions", caching: Caching.REFRESH})
    .catch(error => {
      console.log(error);
      return;
    });
}

function refreshUsersCache(){
  db.query(getUsers, {hash: "getUsers", caching: Caching.REFRESH})
    .catch(error => {
      console.log(error);
      return;
    });
}
function refreshSessionsCache(){
  db.query(getSessions, {hash: "getSessions", caching: Caching.REFRESH})
    .catch(error => {
      console.log(error);
      return;
    });
}

router.post('/changeSessionTime', async (req, res, next) => {

});

router.get('/test', async (req, res, next) => {
  db.query(mysql.format(getUser, [req.query.password]), {caching: Caching.REFRESH})
    .then(response => {
      res.json(response);
    })
});

router.get('/getusersessions', async (req, res, next) => {
  var user = (await db.query(mysql.format(getUser, [req.query.password]), {hash: "getUser"}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  db.query(mysql.format(getUserSessions, [req.query.password]), {hash: "getUserSessions"})
    .then(response => {
      var formatted = [];
      response[0].forEach( session => {
        formatted.push(
          {
            "id": session['id'],
            "startTime": session['startTime'],
            "endTime": session['endTime']
          }
        )
      });
       res.json(formatted);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Something went wrong');
    })
});

router.get('/getuserdata', async (req, res, next) => {
  var user = (await db.query(mysql.format(getUser, [req.query.password]), {hash: "getUser"}))[0];

  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  db.query(mysql.format(getUserSessions, [req.query.password]), {hash: "getUserSessions"})
    .then(response => {
      var totalTime = 0;
      var meetings = 0;
      for( const session of response[0] ){
        if(session['endTime'] - session['startTime'] < parseInt(process.env.MAX_TIME)){
          totalTime += session['endTime'] - session['startTime'];
          if(((Math.floor((session['startTime'] + parseInt(process.env.OFFSET))/86400000)) - 1 & 7) === parseInt(process.env.MEETING_DAY))
            meetings ++;
        }
      }
      res.json({
        "name": user[0]['name'],
        "signedIn": user[0]['signedIn'],
        "totalTime": totalTime,
        "meetings": meetings
      });
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Something went wrong');
      return;
    })
});

router.get('/getusers', async (req, res, next) => {
  var users = [];
  //var userData = {};
  var userTimes = new Map();
  var userMeetings = new Map();
  var currentDate = Date.now();

  // First element in array is totalTime, second is sessions
  var sessions = (await db.query(getSessions, {hash: "getSessions"}))[0];
  for( const session of sessions ){
    if(session['endTime'] - session['startTime'] < parseInt(process.env.MAX_TIME)){
      if(userTimes.has(session['password']))
        userTimes.set(session['password'], userTimes.get(session['password']) + session['endTime'] - session['startTime']);
      else
        userTimes.set(session['password'], 0);

      if(userMeetings.has(session['password'])){
        if(((Math.floor((session['startTime'] + parseInt(process.env.OFFSET))/86400000)) - 1 & 7) === parseInt(process.env.MEETING_DAY))
          userMeetings.set(session['password'], userMeetings.get(session['password']) + 1);
      } else
        userMeetings.set(session['password'], 0);
    }
  }

  console.log(JSON.stringify(Array.from(userTimes.entries())));

  db.query(getUsers, {hash: "getUsers"})
    .then(response => {
      response[0].forEach( user => {
        users.push({
          "id": user['id'],
          "name": user['name'],
          "signedIn": user['signedIn'],
          "timeIn": user['signedIn'] === 1 ? currentDate - user['lastTime'] : 0,
          "totalTime": userTimes.has(user['password']) ? userTimes.get(user['password']) : 0,
          "meetings": userMeetings.has(user['password']) ? userMeetings.get(user['password']) : 0,
        })
      });
    res.json(users);
    })
    .catch(error => {
      console.log(error);
      res.status(500).send('Something went wrong');
    })
});

module.exports = router;
