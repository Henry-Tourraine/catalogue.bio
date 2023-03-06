
const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const process = require('process');

let XLSX = require('xlsx');
const stream = require('stream');
const { google } = require('googleapis');
const {authenticate} = require('@google-cloud/local-auth');

//with service account
const getDriveService = () => {
    const KEYFILEPATH = './service.json';
    const SCOPES = ['https://www.googleapis.com/auth/drive'];
  
    const auth = new google.auth.GoogleAuth({
      keyFile: KEYFILEPATH,
      scopes: SCOPES,
    });
    const driveService = google.drive({ version: 'v3', auth });
    return driveService;
  };





const SCOPES = ['https://www.googleapis.com/auth/drive'];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'service2.json');

async function loadSavedCredentialsIfExist() {
  try {
    const content = await fsp.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}
async function saveCredentials(client) {
  const content = await fsp.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: 'authorized_user',
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fsp.writeFile(TOKEN_PATH, payload);
}
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}
async function listFiles(authClient) {
  const drive = google.drive({version: 'v3', auth: authClient});
  const res = await drive.files.list({
    pageSize: 10,
    fields: 'nextPageToken, files(id, name)',
  });
  const files = res.data.files;
  if (files.length === 0) {
    console.log('No files found.');
    return;
  }

  console.log('Files:');
  files.map((file) => {
    console.log(`${file.name} (${file.id})`);
  });
}
//https://developers.google.com/drive/api/quickstart/nodejs?hl=fr
let getDriveService2 = async()=>{
    let authClient = await authorize();
    const drive = google.drive({version: 'v3', auth: authClient});
    return drive;
}


async function saveToDrive(name){

const Drive = await getDriveService2();
const {data} = await Drive.files.create({
    media: {
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      body: fs.createReadStream('./'+name),
    },
    requestBody: {
      name: "data.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      //file needs to be shared with service account address
      parents: ['1CTrDjdsKbBihUPZpEr5glHMiqZG2hUzY'],
    },
    fields: 'id,name',
  });

  

  console.log(data);
  return data;
};



module.exports = { saveToDrive }