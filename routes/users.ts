import mysql from 'mysql2';
import Router from 'express-promise-router';
import database from '../dbManager';
import { syncUser, updateRequiredMeetingHours } from '../spreadsheet';
import WebSocket from 'ws';
import logger from '../logger';

const router = Router();
const wss = new WebSocket.Server({ port: process.env.WS_PORT }); // Todo: no

const {db, hashTypes, caching} = database;

const createUserTable: string = `
  CREATE TABLE IF NOT EXISTS users(
    id INT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
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

const getUser = "SELECT id, firstName, lastName, signedIn, lastTime FROM users WHERE password = BINARY ?";
const getUserSessions = "SELECT id, startTime, endTime FROM sessions WHERE password = BINARY ?";
const getUsers = "SELECT id, firstName, lastName, password, signedIn, lastTime FROM users";
const getSessions = "SELECT password, startTime, endTime FROM sessions";

refreshUsersCache();
refreshSessionsCache();

db.query(createUserTable, {caching: caching.SKIP}, function (err, res) {
  if (err) throw err;
  if(res.warningCount !== 0)
    logger.debug("User table already exists");
  else
  logger.debug("Created new user table");
});

db.query(createSessionTable, {caching: caching.SKIP}, function (err, res) {
  if (err) throw err;
  if(res.warningCount !== 0)
    logger.debug("Session table already exists");
  else
  logger.debug("Created new session table");
});

/* GET users listing. */
router.get('/', (req, res) => {
  res.send('respond with a resource');
});

router.post('/adduser', async (req, res, next) => {
  const { firstName, lastName, password }: { firstName: string, lastName: string, password: string } = req.body;
  logger.debug(password);

  if( !(firstName && lastName && password) ){
    res.status(400).send("Username or password cannot be empty"); 
    return;
  }

  const addUser: string = "INSERT INTO users(firstName, lastName, password, signedIn, lastTime) VALUES(?, ?, ?, ?, ?)";
  db.query(mysql.format(addUser, [firstName, lastName, password, 0, Date.now()]), {caching: caching.SKIP})
    .then(response => {
      refreshUsersCache();
      refreshUserCache(password);
      logger.info(`Added new user: ${firstName} ${lastName}, ${password}`);
      res.status(200).send(`Added new user: ${firstName} ${lastName}, password: ${password}`);
      return;
    })
    .catch(error => {
      if(error.errno === 1062){
        res.status(400).send('User already exists');
        return;
      }
      else {
        logger.error(error);
        res.status(500).send('Something went wrong');
        return;
      }
    });
});

router.post('/signin', async (req, res, next) => {
  const signIn = "UPDATE users SET lastTime = ?, signedIn = 1 WHERE password = BINARY ?";
  var user = (await db.query(mysql.format(getUser, [req.body.password]), {hash: "getUser " + req.body.password}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  if( user[0]['signedIn'] === 1 ){
    res.status(400).send("User already signed in");
    return;
  }

  db.query(mysql.format(signIn, [Date.now(), req.body.password]), {caching: caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshUsersCache();
      res.status(200).send(`Signed in user: ${user[0]['firstName']} ${user[0]['lastName']}`);
      broadcastUpdate("Sign in update");
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

router.post('/addsession', async (req, res, next) => {
  const addSession = "INSERT INTO sessions(password, startTime, endTime) VALUES(?, ?, ?)";

  var user = (await db.query(mysql.format(getUser, [req.body.password]), {hash: "getUser " + req.body.password}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  db.query(mysql.format(addSession, [req.body.password, req.body.startTime, req.body.endTime]), {caching: caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshSessionsCache();
      res.status(200).send(`Added session for user: ${user[0]['firstName']} ${user[0]['lastName']}`);
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

router.post('/signout', async (req, res, next) => {
  const signOut = "UPDATE users SET signedIn = 0 WHERE password = BINARY ?";
  const addSession = "INSERT INTO sessions(password, startTime, endTime) VALUES(?, ?, ?)";

  var user = (await db.query(mysql.format(getUser, [req.body.password]), {hash: "getUser " + req.body.password}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  if( user[0]['signedIn'] === 0 ){
    res.status(400).send("User not signed in");
    return;
  }

  db.query(mysql.format(signOut, [req.body.password]), {caching: caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshUsersCache();
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });

  db.query(mysql.format(addSession, [req.body.password, user[0]['lastTime'], Date.now()]), {caching: caching.SKIP})
    .then(async response => {
      res.status(200).send(`Signed out user: ${user[0]['firstName']} ${user[0]['lastName']}`);
      refreshSessionsCache();
      let userData: any = await getUserData(req.body.password);
      syncUser(user[0]['firstName'], user[0]['lastName'], [[Math.trunc(userData.totalTime / 36000) / 100, userData.meetings]]);
      broadcastUpdate("Sign out update");
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
  });

  updateRequiredMeetingHours(user[0]["firstName"], user[0]["lastName"], new Date(user[0]["lastTime"]), new Date());
});

async function getUserData(password){
  return new Promise(function(resolve, reject) {
    db.query(mysql.format(getUserSessions, [password]), {hash: "getUserSessions " + password})
      .then(response => {
        var totalTime = 0;
        var meetings = 0;
        for( const session of response[0] ){
          if(session['endTime'] - session['startTime'] < parseInt(process.env.MAX_TIME)){
            totalTime += session['endTime'] - session['startTime'];
            if(((Math.floor((session['startTime'] + parseInt(process.env.OFFSET))/86400000)) + 1 & 7) === parseInt(process.env.MEETING_DAY))
              meetings ++;
          }
        }
        resolve ({
          "totalTime": totalTime,
          "meetings": meetings,
        });
      })
      .catch(error => {
        logger.error(error);
        reject();
      })
  });
}

function refreshUserCache(password){
  db.query(mysql.format(getUser, [password]), {hash: "getUser " + password, caching: caching.REFRESH})
    .catch(error => {
      logger.error(error);
      return;
    });

  db.query(mysql.format(getUserSessions, [password]), {hash: "getUserSessions " + password, caching: caching.REFRESH})
    .catch(error => {
      logger.error(error);
      return;
    });
}

function refreshUsersCache(){
  db.query(getUsers, {hash: "getUsers", caching: caching.REFRESH})
    .catch(error => {
      logger.error(error);
      return;
    });
}

function refreshSessionsCache(){
  db.query(getSessions, {hash: "getSessions", caching: caching.REFRESH})
    .catch(error => {
      logger.error(error);
      return;
    });
}

function broadcastUpdate(message){
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Endpoint to change a sessions's end time using the start time and the new end time, and the password of the user
router.post('/changesession', async (req, res, next) => {
  const changeSession = "UPDATE sessions SET endTime = ? WHERE password = BINARY ? AND startTime = ?";

  var user = (await db.query(mysql.format(getUser, [req.body.password]), {hash: "getUser " + req.body.password}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  db.query(mysql.format(changeSession, [req.body.endTime, req.body.password, req.body.startTime]), {caching: caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshSessionsCache();
      res.status(200).send(`Changed session for user: ${user[0]['firstName']} ${user[0]['lastName']}`);
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

/* Needs admin auth
// Endpoint to delete a session using the start time and the password of the user
router.post('/deletesession', async (req, res, next) => {
  const deleteSession = "DELETE FROM sessions WHERE password = BINARY ? AND startTime = ?";

  var user = (await db.query(mysql.format(getUser, [req.body.password]), {hash: "getUser " + req.body.password}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  db.query(mysql.format(deleteSession, [req.body.password, req.body.startTime]), {caching: caching.SKIP})
    .then(response => {
      refreshUserCache(req.body.password);
      refreshSessionsCache();
      res.status(200).send(`Deleted session for user: ${user[0]['firstName']} ${user[0]['lastName']}`);
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

// Endpoint to delete a user using the password of the user
router.post('/deleteuser', async (req, res, next) => {
  const deleteUser = "DELETE FROM users WHERE password = BINARY ?";

  var user = (await db.query(mysql.format(getUser, [req.body.password]), {hash: "getUser " + req.body.password}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  db.query(mysql.format(deleteUser, [req.body.password]), {caching: caching.SKIP})
    .then(response => {
      refreshUsersCache();
      res.status(200).send(`Deleted user: ${user[0]['firstName']} ${user[0]['lastName']}`);
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

*/

// Endpoint to get all the users
router.get('/users', async (req, res, next) => {
  const getUsers = "SELECT * FROM users";

  db.query(getUsers, {hash: "getUsers"})
    .then(response => {
      res.status(200).send(response[0]);
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });
});

router.get('/refreshcache', async (req, res, next) => {
  refreshUsersCache();
  refreshSessionsCache();
  res.status(200).send('Refreshed user and sessions cache');
});


router.get('/getsessions', async (req, res, next) => {
  const getAllUserSessions = `
    SELECT sessions.startTime, sessions.endTime, sessions.password, users.firstName, users.lastName
    FROM sessions
    INNER JOIN users
    ON sessions.password = users.password
    WHERE sessions.startTime > ?
  `;

  db.query(mysql.format(getAllUserSessions, [req.query.time]), {hash: "getAllUserSessions " + req.query.time})
    .then(response => {
      res.status(200).send(response[0]);
      return;
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });
});


router.get('/getusersessions', async (req, res, next) => {
  var user = (await db.query(mysql.format(getUser, [req.query.password]), {hash: "getUser " + req.query.password}))[0];
  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  db.query(mysql.format(getUserSessions, [req.query.password]), {hash: "getUserSessions " + req.query.password})
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
      logger.error(error);
      res.status(500).send('Something went wrong');
    })
});

router.get('/getuserdata', async (req, res, next) => {
  var user = (await db.query(mysql.format(getUser, [req.query.password]), {hash: "getUser " + req.query.password}))[0];

  if( user.length === 0 ){
    res.status(404).send(`User not found`);
    return;
  }

  const userData: any = await getUserData(req.query.password)
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
      return;
    });

  res.json({
    "name": user[0]['firstName'] + " " + user[0]['lastName'],
    "signedIn": user[0]['signedIn'],
    "totalTime": userData.totalTime,
    "meetings": userData.meetings
  });
});

router.get('/getusers', async (req, res, next) => {
  var users = [];
  var userTimes = new Map();
  var userMeetings = new Map();
  var currentDate = Date.now();

  var sessions = (await db.query(getSessions, {hash: "getSessions"}))[0];
  for( const session of sessions ){
    if(session['endTime'] - session['startTime'] < parseInt(process.env.MAX_TIME)){
      if(userTimes.has(session['password']))
        userTimes.set(session['password'], userTimes.get(session['password']) + session['endTime'] - session['startTime']);
      else
        userTimes.set(session['password'], session['endTime'] - session['startTime']);

      if(userMeetings.has(session['password'])){
        if(((Math.floor((session['startTime'] + parseInt(process.env.OFFSET))/86400000)) + 1 & 7) === parseInt(process.env.MEETING_DAY))
          userMeetings.set(session['password'], userMeetings.get(session['password']) + 1);
      } else
        userMeetings.set(session['password'], 0);
    }
  }

  db.query(getUsers, {hash: "getUsers"})
    .then(response => {
      response[0].forEach( user => {
        users.push({
          "id": user['id'],
          "name": user['firstName'] + " " + user['lastName'],
          "signedIn": user['signedIn'],
          "timeIn": user['signedIn'] === 1 ? currentDate - user['lastTime'] : 0,
          "totalTime": userTimes.has(user['password']) ? userTimes.get(user['password']) : 0,
          "meetings": userMeetings.has(user['password']) ? userMeetings.get(user['password']) : 0,
        })
      });
      res.json(users);
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
    })
});

router.post('/syncusers', async (req, res, next) => {
  var users = (await db.query(getUsers, {hash: "getUsers"}))[0];
  syncUsers(users); // This is prevent HTTP 504 Gateway Timeout

  res.status(200).send('Syncing all users');
});

async function syncUsers(users: any[]) {
  for( const user of users ){
    let userData: any = await getUserData(user['password']);
    syncUser(user['firstName'], user['lastName'], [[Math.trunc(userData.totalTime / 36000) / 100, userData.meetings]]);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Change user password
router.post('/changepassword', async (req, res, next) => {
  const changePassword = `
    UPDATE users
    SET password = ?
    WHERE password = ?
  `;
    // Update previous sessions
  const updateSessions = `
    UPDATE sessions
    SET password = ?
    WHERE password = ?
  `;

  db.query(mysql.format(changePassword, [req.body.newPassword, req.body.oldPassword]), {hash: "changePassword " + req.body.oldPassword})
    .then(response => {
      db.query(mysql.format(updateSessions, [req.body.newPassword, req.body.oldPassword]), {hash: "updateSessions " + req.body.oldPassword})
        .then(response => {
          refreshUserCache(req.body.newPassword);
          refreshUsersCache();
          res.status(200).send('Password changed');
          return;
        })
        .catch(error => {
          logger.error(error);
          res.status(500).send('Something went wrong');
          return;
        });
    })
    .catch(error => {
      logger.error(error);
      res.status(500).send('Something went wrong');
    })
});

module.exports = router;
