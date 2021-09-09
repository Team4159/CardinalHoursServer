import express from "express";
const app = express();
require('dotenv').config();
const port = process.env.PORT; // default port to listen

// define a route handler for the default home page
app.get( "/", ( req, res ) => {
    res.send( "Hello world!" );
} );

// start the Express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );

var usersRouter = require('./routes/users');
//var adminRouter = require('./routes/admin');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/users', usersRouter);
//app.use('/admin', adminRouter);
