import mysql from 'mysql-await';
import Router from "express-promise-router";
const router = Router();

require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
});

db.getConnection(function(err, connection) {
  if (err) throw err;
  console.log('connected as id ' + connection.threadId);
})

const createUserTable: string = `
  CREATE TABLE IF NOT EXISTS users(
    name TEXT NOT NULL,
    password TEXT NOT NULL UNIQUE,
    signedIn BOOL DEFAULT false,
    lastTime BIGINT NOT NULL
  )
`;

const createSessionTable: string = `
  CREATE TABLE IF NOT EXISTS sessions(
    password TEXT NOT NULL,
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

  if( username === '' || password === '' ){
    res.status(400).send("Username or password cannot be empty"); 
    return;
  }

  const addUser: string = "INSERT INTO users(name, password, signedIn, lastTime) VALUES(?, ?, ?, ?)";
  con.query(mysql.format(addUser, [username, password, 0, Date.now()]), function (error, response) {
    if (error) {
      if(error.errno === 1062){
        con.awaitRollback();
        res.status(400).send('User already exists');
      }
      else {
        con.awaitRollback();
        console.log(error);
        res.status(500).send('Something went wrong');
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
    res.status(400).send("User already signed in");
    return;
  }

  con.query(mysql.format(signIn, [Date.now(), req.body.password]), function (error, response) {
    if (error) {
      con.awaitRollback();
      console.log(error);
      res.status(500).send('Something went wrong');
    } else {
      con.awaitCommit();
      res.status(200).send(`signed in user: ${user[0]['name']}`);
    }
  });

  con.release();
});

/*
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
*/

/*
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
*/
module.exports = router;
