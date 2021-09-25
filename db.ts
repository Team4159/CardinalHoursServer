import mysql from 'mysql2';
const asyncRedis = require("async-redis");
require('dotenv').config();

const { MysqlRedisAsync, HashTypes, Caching } = require("mysql-redis");

const cacheOptions = {
    expire: 2629746,// seconds, defaults to 30 days
    keyPrefix: "sql.", // default
    hashType: HashTypes.md5, //default
    caching: Caching.CACHE //default
};

const redis = asyncRedis.createClient();

const poolPromise = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
}).promise();

const mysqlRedis = new MysqlRedisAsync(
    poolPromise,
    redis
);

exports.Caching = Caching;
exports.HashTypes = HashTypes;
exports.db = mysqlRedis;
