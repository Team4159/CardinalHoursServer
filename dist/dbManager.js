"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mysql2_1 = __importDefault(require("mysql2"));
const asyncRedis = require("async-redis");
require('dotenv').config();
const { MysqlRedisAsync, HashTypes, Caching } = require("mysql-redis");
const cacheOptions = {
    expire: 2629746,
    keyPrefix: "sql.",
    hashType: HashTypes.md5,
    caching: Caching.CACHE
};
const redis = asyncRedis.createClient(cacheOptions);
const poolPromise = mysql2_1.default.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
}).promise();
const mysqlRedis = new MysqlRedisAsync(poolPromise, redis);
exports.default = {
    hashTypes: HashTypes,
    caching: Caching,
    db: mysqlRedis,
};
//# sourceMappingURL=dbManager.js.map