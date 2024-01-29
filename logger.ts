import winston from "winston";

const logger = winston.createLogger({
    level: "debug",
    format: winston.format.combine(
        winston.format.json(),
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
    ),
    transports: [
        new winston.transports.File({ filename: newLogFileName("error"), level: "error" }),
        new winston.transports.File({ filename: newLogFileName("debug") }),
        new winston.transports.Console(),
    ],
});

function newLogFileName(type: string): string {
    const pathSegments = [];
    pathSegments.push("logs");
    if (process.env.NODE_ENV === "testing") { pathSegments.push("tests") }
    pathSegments.push(type);
    pathSegments.push(type + "_" + dateToTimestamp());

    return pathSegments.join("/") + ".log";
}

function dateToTimestamp(date?: Date): string {
    if (!date) {
        date = new Date();
    }

    return date.getFullYear() + "-" + date.getMonth() + "-" + date.getDate() + "-" + date.getTime();
}

export default logger;
