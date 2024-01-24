import { sheets_v4 } from "googleapis";
import logger from "./logger";

function columnToLetter(column: number) {
    column++;

    var temp,
        letter = "";
    while (column > 0) {
        temp = (column - 1) % 26;
        letter = String.fromCharCode(temp + 65) + letter;
        column = (column - temp - 1) / 26;
    }
    return letter;
}

function letterToColumn(letter: string) {
    var column = 0,
        length = letter.length;
    for (var i = 0; i < length; i++) {
        column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1);
    }
    return --column;
}

async function getNamesList(sheets: sheets_v4.Sheets, spreadsheetId: string) {
    const names = (await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: "TotalHours!A:B",
        majorDimension: "ROWS",
    })).data.values;

    if (!names || names.length === 0) {
        console.error("Empty names list"); // ERROR!
        return [];
    }

    return names;
}

function getName(names: string[][], firstName: string, lastName: string): number {
    let nameIndex = -1;

    for (let i = 0; i < names.length; i++) {
        if (names[i][0] === firstName && names[i][1] === lastName) {
            nameIndex = i;
        }
    }

    return nameIndex;
}

async function getNextColumnIndex(sheets: sheets_v4.Sheets, spreadsheetId: string) {
    const columnTitles = (await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: "TotalHours!A1:1",
        majorDimension: "COLUMNS",
    })).data.values;

    if (!columnTitles) {
        console.error("Column not found!"); // ERROR!
        return -1;
    }

    return columnTitles.length;
}

async function getColumnIndexFromColumnTitle(sheets: sheets_v4.Sheets, spreadsheetId: string, columnTitle: string): Promise<number> {
    const columnTitles = (await sheets.spreadsheets.values.get({
        spreadsheetId: spreadsheetId,
        range: "TotalHours!A1:1",
        majorDimension: "COLUMNS",
    })).data.values;

    if (!columnTitles) {
        return -1;
    }

    return columnTitles.flat().indexOf(columnTitle);
}

function datesToHours(startDate: Date, endDate: Date): number {
    return Math.trunc((endDate.valueOf() - startDate.valueOf()) / 36000) / 100
}

async function asyncExponentialBackoff(f: Function, maxAttempts = 100) {
    let succeeded = false;
    let attempts = 0;
    let backoffTime = 0; // In seconds

    while (!succeeded) {
        try {
            return await f();
        } catch (err) {
            logger.error("Exponential backoff error caught!");
            logger.error(err);

            backoffTime = Math.min(Math.pow(2, attempts) + Math.random(), 64);

            logger.error(`Attempt: ${attempts} Backoff Time: ${backoffTime}`);
            await new Promise(resolve => setTimeout(resolve, backoffTime * 1000));
            attempts++;

            if (attempts > maxAttempts) {
                throw err;
            }
        }
    }
}

export {
    columnToLetter,
    letterToColumn,
    getNamesList,
    getName,
    getNextColumnIndex,
    getColumnIndexFromColumnTitle,
    datesToHours,
    asyncExponentialBackoff,
}