"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const readline_1 = __importDefault(require("readline"));
const googleapis_1 = require("googleapis");
require('dotenv').config();
const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var credentials;
fs_1.default.readFile('credentials.json', (err, content) => __awaiter(void 0, void 0, void 0, function* () {
    if (err)
        return console.log('Error loading client secret file:', err);
    credentials = JSON.parse(content.toString());
    authorize(credentials, (res) => __awaiter(void 0, void 0, void 0, function* () {
        console.log("Connected to spreadsheet: " + (yield getSheetName()));
    }));
}));
function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new googleapis_1.google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    // Check if we have previously stored a token.
    fs_1.default.readFile(TOKEN_PATH, (err, token) => {
        if (err)
            return getNewToken(oAuth2Client, callback);
        oAuth2Client.setCredentials(JSON.parse(token.toString()));
        callback(oAuth2Client);
    });
}
function getNewToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline_1.default.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err)
                return console.error('Error while trying to retrieve access token', err);
            oAuth2Client.setCredentials(token);
            fs_1.default.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err)
                    return console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}
function getAuth(credentials) {
    return __awaiter(this, void 0, void 0, function* () {
        return new Promise(function (resolve, reject) {
            authorize(credentials, res => {
                resolve(res);
            });
        });
    });
}
function getSheetName() {
    return __awaiter(this, void 0, void 0, function* () {
        var auth = yield getAuth(credentials);
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        return new Promise(function (resolve, reject) {
            sheets.spreadsheets.get({
                spreadsheetId: process.env.SHEET_ID
            }, (err, res) => {
                if (err)
                    return console.log('The API returned an error: ' + err);
                resolve(res.data.properties.title);
            });
        });
    });
}
function getUserRow(firstName, lastName) {
    return __awaiter(this, void 0, void 0, function* () {
        const names = yield getNames();
        for (let i = 0; i < names.length; i++) {
            if (names[i][0] === firstName && names[i][1] === lastName)
                return ++i;
        }
        return -1;
    });
}
function getNames() {
    return __awaiter(this, void 0, void 0, function* () {
        var auth = yield getAuth(credentials);
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        return new Promise(function (resolve, reject) {
            sheets.spreadsheets.values.get({
                spreadsheetId: process.env.SHEET_ID,
                range: `${process.env.SHEET_NAME}!A:B`,
            }, (err, res) => {
                if (err)
                    return console.log('The API returned an error: ' + err);
                resolve(res.data.values);
            });
        });
    });
}
function syncUser(firstName, lastName, data) {
    return __awaiter(this, void 0, void 0, function* () {
        var auth = yield getAuth(credentials);
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        const row = yield getUserRow(firstName, lastName);
        if (row === -1) {
            console.log(`User not found. Adding user ${firstName} ${lastName}`);
            sheets.spreadsheets.values.append({
                spreadsheetId: process.env.SHEET_ID,
                range: process.env.SHEET_NAME,
                valueInputOption: "RAW",
                insertDataOption: "INSERT_ROWS",
                requestBody: { values: [[firstName, lastName, data[0][0], data[0][1]]] },
            }, (err, result) => {
                if (err)
                    return console.log('The API returned an error: ' + err);
            });
        }
        else {
            sheets.spreadsheets.values.update({
                spreadsheetId: process.env.SHEET_ID,
                range: `${process.env.SHEET_NAME}!C${row}:D${row}`,
                valueInputOption: "RAW",
                requestBody: { values: data },
            }, (err, result) => {
                if (err)
                    return console.log('The API returned an error: ' + err);
            });
        }
    });
}
exports.default = {
    syncUser: syncUser,
};
//# sourceMappingURL=spreadsheet.js.map