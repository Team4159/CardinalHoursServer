import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import logger from "./logger";
import usersRouter from "./routes/users";

const app = express();
const port = process.env.PORT;

app.use(cors());
app.options("*", cors());

app.get("/", (req, res) => {
  res.send("Welcome to the Cardinalbotics login API!");
});

app.listen(port, () => {
  logger.debug(`server started at port: ${port}`);
});

//var adminRouter = require('./routes/admin');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/users", usersRouter);
// app.use('/admin', adminRouter);
