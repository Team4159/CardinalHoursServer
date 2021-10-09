import fs from 'fs';
import readline from 'readline';
import {google} from 'googleapis';
require('dotenv').config();

const TOKEN_PATH = 'token.json';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

fs.readFile('credentials.json', async (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  authorize(JSON.parse(content.toString()), async (auth) => {
    console.log("Connected to spreadsheet: " + await getSheetName(auth));
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
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error while trying to retrieve access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

async function getSheetName(auth){
  const sheets = google.sheets({version: 'v4', auth});
  return new Promise(function(resolve, reject) {
    sheets.spreadsheets.get({
      spreadsheetId: process.env.SHEET_ID
    }, (err, res) => {
      if (err) return console.log('The API returned an error: ' + err);
      resolve(res.data.properties.title);
    });
  });
}

async function syncUser(auth) {

}

export default {
  syncUser: syncUser,
}
