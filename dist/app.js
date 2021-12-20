"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const app = express_1.default();
require('dotenv').config();
const port = process.env.PORT;
app.use(cors_1.default());
app.options('*', cors_1.default());
app.get("/", (req, res) => {
    res.send("Welcome to the Cardinalbotics login API!");
});
app.listen(port, () => {
    console.log(`server started at http://localhost:${port}`);
});
var usersRouter = require('./routes/users');
//var adminRouter = require('./routes/admin');
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use('/users', usersRouter);
//app.use('/admin', adminRouter);
//# sourceMappingURL=app.js.map