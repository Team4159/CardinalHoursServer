import fs from 'fs';
import readline from 'readline';
import {google} from 'googleapis';
import logger from "./logger";
require('dotenv').config();

const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
var credentials;

fs.readFile('credentials.json', async (err, content) => {
  if (err) return logger.error('Error loading client secret file:', err);
  credentials = JSON.parse(content.toString());
  authorize(credentials, async (res) => {
    logger.debug("Connected to spreadsheet: " + await getSheetName());
  });
});

function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token.toString()));
    callback(oAuth2Client);
  });
}

function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  logger.info('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        logger.info('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

async function getAuth(credentials){
  return new Promise(function(resolve, reject) {
    authorize(credentials, res => {
      resolve(res);
    });
  });
}

async function getSheetName(){
  var auth: any = await getAuth(credentials);
  const sheets = google.sheets({version: 'v4', auth});
  return new Promise(function(resolve, reject) {
    sheets.spreadsheets.get({
      spreadsheetId: process.env.SHEET_ID
    }, (err, res) => {
      if (err) return logger.error('The API returned an error: ' + err);
      resolve(res.data.properties.title);
    });
  });
}

async function getUserRow(firstName, lastName){
  const names : any = await getNames();
  for(let i = 0; i < names.length; i++){
    if(names[i][0] === firstName && names[i][1] === lastName)
      return ++i;
  }
  return -1;
}

async function getNames(){
  var auth: any = await getAuth(credentials);
  const sheets = google.sheets({version: 'v4', auth});
  return new Promise(function(resolve, reject) {
    sheets.spreadsheets.values.get({
      spreadsheetId: process.env.SHEET_ID,
      range: `${process.env.SHEET_NAME}!A:B`,
    }, (err, res) => {
      if (err) return logger.error('The API returned an error: ' + err);
      resolve(res.data.values);
    });
  });
}

async function syncUser(firstName, lastName, data) {
  var auth: any = await getAuth(credentials);
  const sheets = google.sheets({version: 'v4', auth});
  const row = await getUserRow(firstName, lastName);
  if(row === -1){
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
    sheets.spreadsheets.values.update({
      spreadsheetId: process.env.SHEET_ID,
      range: `${process.env.SHEET_NAME}!${process.env.COLUMN_ID_START}${row}:${process.env.COLUMN_ID_END}${row}`,
      valueInputOption: "RAW",
      requestBody: {values: data},
    }, (err, result) => {
      if (err) return logger.info('The API returned an error: ' + err);
    });
  }
}

export default {
  syncUser: syncUser,
}
