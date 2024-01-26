import mysql from 'mysql2';
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

export default {
  hashTypes: HashTypes,
  caching: Caching,
  db: mysqlRedis,
}
