import express from 'express';
import cors from 'cors';
const app = express();
require('dotenv').config();
const port = process.env.PORT;

app.use(cors());
app.options('*', cors());

app.get( "/", ( req, res ) => {
    res.send( "Welcome to the Cardinalbotics login API!" );
});

app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
});

var usersRouter = require('./routes/users');
//var adminRouter = require('./routes/admin');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/users', usersRouter);
//app.use('/admin', adminRouter);
