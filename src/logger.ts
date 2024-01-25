import winston from "winston";

const logger = winston.createLogger({
  level: "debug",
  format: winston.format.combine(winston.format.json(), winston.format.timestamp(), winston.format.errors({ stack: true })),
  transports: [new winston.transports.File({ filename: "logs/debug.log" }), new winston.transports.Console()],
});

const errLogger = winston.createLogger({
  level: "error",
  format: winston.format.combine(winston.format.json(), winston.format.timestamp(), winston.format.errors({ stack: true })),
  transports: [new winston.transports.File({ filename: "logs/error.log" }), new winston.transports.Console()],
});

// override
logger.error = errLogger.error;

export default logger;
