import mysql from "mysql2";
import asyncRedis from "async-redis";
import { MysqlRedisAsync, HashTypes, Caching } from "mysql-redis";
import dotenv from "dotenv";
dotenv.config();

const cacheOptions = {
  expire: 2629746,
  keyPrefix: "sql.",
  hashType: HashTypes.md5,
  caching: Caching.CACHE,
};

const redis = (asyncRedis as any).createClient(cacheOptions);

const poolPromise = mysql
  .createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
  })
  .promise();

const mysqlRedis = new MysqlRedisAsync(poolPromise, redis);

export default {
  hashTypes: HashTypes,
  caching: Caching,
  db: mysqlRedis,
};
