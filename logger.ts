import winston from "winston";

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.combine(
        winston.format.json(),
        winston.format.errors({ stack: true }),
        winston.format.timestamp()),
    transports: [
        new winston.transports.File({ filename: "logs/error.log", level: "error" }),
        new winston.transports.File({ filename: "logs/debug.log" }),
        new winston.transports.Console(),
    ],
});

export default logger;
