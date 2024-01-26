import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
import logger from "./logger";
import {
    asyncExponentialBackoff,
    columnToLetter,
    datesToHours,
    getColumnIndexFromColumnTitle,
    getName,
    getNamesList,
    getNextColumnIndex,
} from "./utils";
import database from "./dbManager";
import mysql from "mysql2";

import dotenv from "dotenv";
dotenv.config();

const TOKEN_PATH = "token.json";
const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];
var credentials;

fs.readFile("credentials.json", async (err, content) => {
    if (err) return logger.error("Error loading client secret file:", err);
    credentials = JSON.parse(content.toString());
    authorize(credentials, async (res) => {
        logger.debug("Connected to spreadsheet: " + (await getSheetName()));
    });
});

function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
        if (err) return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token.toString()));
        callback(oAuth2Client);
    });
}

function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: "offline",
        scope: SCOPES,
    });
    logger.info("Authorize this app by visiting this url:", authUrl);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question("Enter the code from that page here: ", (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error("Error while trying to retrieve access token", err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) return console.error(err);
                logger.info("Token stored to", TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

async function getAuth(credentials) {
    return new Promise(function (resolve, reject) {
        authorize(credentials, (res) => {
            resolve(res);
        });
    });
}

async function getSheetName() {
    var auth: any = await getAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });
    return new Promise(function (resolve, reject) {
        sheets.spreadsheets.get(
            {
                spreadsheetId: process.env.SHEET_ID,
            },
            (err, res) => {
                if (err) return logger.error("The API returned an error: " + err);
                resolve(res.data.properties.title);
            }
        );
    });
}

async function getUserRow(firstName, lastName) {
    const names: any = await getNames();
    for (let i = 0; i < names.length; i++) {
        if (names[i][0] === firstName && names[i][1] === lastName) return ++i;
    }
    return -1;
}

async function getNames() {
    var auth: any = await getAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });
    return new Promise(function (resolve, reject) {
        sheets.spreadsheets.values.get(
            {
                spreadsheetId: process.env.SHEET_ID,
                range: `${process.env.SHEET_NAME}!A:B`,
            },
            (err, res) => {
                if (err) return logger.error("The API returned an error: " + err);
                resolve(res.data.values);
            }
        );
    });
}

async function syncUser(firstName, lastName, data) {
    var auth: any = await getAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });
    const row = await asyncExponentialBackoff(async () => await getUserRow(firstName, lastName));
    if (row === -1) {
        logger.debug(`User ${firstName} ${lastName} not found in spreadsheet ${process.env.SHEET_NAME}`);
        /*
    sheets.spreadsheets.values.append({
      spreadsheetId: process.env.SHEET_ID,
      range: process.env.SHEET_NAME,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: {values: [[firstName, lastName, data[0][0], data[0][1]]]},
    }, (err, result) => {
      if (err) return logger.error('The API returned an error: ' + err);
    });
    */
    } else {
        await asyncExponentialBackoff(async () => {
            await sheets.spreadsheets.values.update(
                {
                    spreadsheetId: process.env.SHEET_ID,
                    range: `${process.env.SHEET_NAME}!${process.env.COLUMN_ID_START}${row}:${process.env.COLUMN_ID_END}${row}`,
                    valueInputOption: "RAW",
                    requestBody: { values: data },
                },
                (err, result) => {
                    if (err) return logger.error("The API returned an error: " + err);
                }
            );
        });
    }
}

async function syncUsersTotalHours() {
    var auth: any = await getAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    logger.debug("Clearing TotalHours");
    await asyncExponentialBackoff(async () => {
        await sheets.spreadsheets.batchUpdate({
            // Clear TotalHours sheet
            spreadsheetId: process.env.SHEET_ID,
            requestBody: {
                requests: [
                    {
                        deleteDimension: {
                            range: {
                                sheetId: parseInt(process.env.REQUIRED_MEETING_SHEET_ID),
                                dimension: "COLUMNS",
                                startIndex: 2, // From C
                            },
                        },
                    },
                ],
            },
        });
    });

    const earliestDate = new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 6) * 6, 1).valueOf();
    const [sessions] = await database.db.query(
        mysql.format("SELECT * FROM sessions WHERE startTime > ? ORDER BY startTime", [earliestDate.valueOf()])
    );

    for (const session of sessions) {
        const sessionStartDate = new Date(session["startTime"]);
        const sessionEndDate = new Date(session["endTime"]);
        const [[user]] = await database.db.query(mysql.format("SELECT * FROM users WHERE password = BINARY ?", [session["password"]]));

        logger.debug(`Adding ${user["firstName"]} ${user["lastName"]}'s session on ${sessionEndDate.toDateString} at ${sessionEndDate.toTimeString()} to TotalHours`);

        await updateTotalMeetingHours(user["firstName"], user["lastName"], sessionStartDate, sessionEndDate);
    }
}

const requiredMeetingDays: number[] = process.env.REQUIRED_MEETING_DAYS.split(",").map((item) => parseInt(item));

async function updateTotalMeetingHours(firstName: string, lastName: string, startDate: Date, endDate: Date) {
    // Log every day
    // if (startDate.toDateString() !== endDate.toDateString() || requiredMeetingDays.indexOf(startDate.getDay()) === -1) {
    //     logger.debug("Today is not a meeting day");
    //     return; // Not a required meeting day, so no need to continue
    // }

    let dateHours = datesToHours(startDate, endDate);

    // if (dateHours > 10) {
    //     return; // Can't log too many hours
    // }

    const dateString = endDate.getMonth() + 1 + "/" + endDate.getDate();

    const auth: any = await getAuth(credentials);
    const sheets = google.sheets({ version: "v4", auth });

    let names = await asyncExponentialBackoff(async () => await getNamesList(sheets, process.env.SHEET_ID));
    let nameRowIndex = getName(names, firstName, lastName);

    if (nameRowIndex === -1) {
        logger.debug("Adding new row for name");
        await asyncExponentialBackoff(async () => {
            await sheets.spreadsheets.batchUpdate({
                // Add new row
                spreadsheetId: process.env.SHEET_ID,
                requestBody: {
                    requests: [
                        {
                            appendDimension: {
                                sheetId: parseInt(process.env.REQUIRED_MEETING_SHEET_ID),
                                dimension: "ROWS",
                                length: 1,
                            },
                        },
                    ],
                },
            });
        });

        // Update newly created row with first name and last name
        await asyncExponentialBackoff(async () => {
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SHEET_ID,
                range: `TotalHours!A${names.length + 1}:B`,
                valueInputOption: "RAW",
                requestBody: {
                    majorDimension: "COLUMNS",
                    values: [[firstName], [lastName]],
                },
            });
        });

        names = await asyncExponentialBackoff(async () => await getNamesList(sheets, process.env.SHEET_ID));
        nameRowIndex = names.length - 1;
    }

    let dateColumnIndex = await asyncExponentialBackoff(
        async () => await getColumnIndexFromColumnTitle(sheets, process.env.SHEET_ID, `${dateString} Hours`)
    );

    if (dateColumnIndex === -1) {
        logger.debug("Adding new column for date");
        dateColumnIndex = await asyncExponentialBackoff(async () => await getNextColumnIndex(sheets, process.env.SHEET_ID));

        // Update column title of newly created column
        await asyncExponentialBackoff(async () => {
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId: process.env.SHEET_ID,
                requestBody: {
                    requests: [
                        {
                            insertDimension: {
                                inheritFromBefore: true,
                                range: {
                                    sheetId: parseInt(process.env.REQUIRED_MEETING_SHEET_ID),
                                    dimension: "COLUMNS",
                                    startIndex: dateColumnIndex,
                                    endIndex: dateColumnIndex + 1,
                                },
                            },
                        },
                    ],
                },
            });
        });

        await asyncExponentialBackoff(async () => {
            await sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SHEET_ID,
                range: `TotalHours!${columnToLetter(dateColumnIndex)}1`,
                valueInputOption: "RAW",
                requestBody: {
                    majorDimension: "ROWS",
                    values: [[`${dateString} Hours`]],
                },
            });
        });
    } else {
        // Get dateHours
        const cell = (
            await asyncExponentialBackoff(
                async () =>
                    await sheets.spreadsheets.values.get({
                        spreadsheetId: process.env.SHEET_ID,
                        range: `TotalHours!${columnToLetter(dateColumnIndex)}${nameRowIndex + 1}`,
                    })
            )
        ).data.values;

        if (cell && cell.length > 0 && cell[0] && cell[0].length > 0 && cell[0][0]) {
            dateHours += parseInt(cell[0][0]);
        }
    }

    logger.debug(`Update ${firstName} ${lastName} hours on ${dateString} to ${dateHours}`);

    // Update cell
    await asyncExponentialBackoff(async () => {
        await sheets.spreadsheets.values.update({
            spreadsheetId: process.env.SHEET_ID,
            range: `TotalHours!${columnToLetter(dateColumnIndex)}${nameRowIndex + 1}`,
            valueInputOption: "RAW",
            requestBody: {
                majorDimension: "COLUMNS",
                values: [[dateHours]],
            },
        });
    });
}

export { syncUser, updateTotalMeetingHours, syncUsersTotalHours };
