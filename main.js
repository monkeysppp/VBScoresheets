'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

const files = require('./lib/files.js');

const debug = require('debug')('vbs:main');

let mainWindow;
let teamDataObj;
let teamDataFilename;

app.on('ready', createWindow);

function createWindow() {
  debug('#createWindow creating main window');

  mainWindow = new BrowserWindow({
    frame: false,
    resizable: true,
    height: 500,
    width: 800
  });

  mainWindow.loadURL('file://' + __dirname + '/app/index.html');
  debug('main window created');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

}

ipc.on('index-ready', (event) => {
  files.listTeamFiles()
    .then((filelist) => {
      debug('#createWindow got file list');
      if (filelist.length === 0) {
        event.sender.send('change-state', 'loading', 'add-first-team');
        debug('#createWindow drawing addFirstTeam');
      } else {
        event.sender.send('change-state', 'loading', 'pick-a-team');
        debug('#createWindow drawing pickATeam');
      }
    });
});

app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow();
  }
});

ipc.on('close-main-window', () => {
  debug('on close-main-window called');
  app.quit();
});

ipc.on('save-team-data', (event, filename, teamData) => {
  debug('on save-team-data called');
  teamDataObj = teamData;
  files.saveTeamFile(filename, teamData)
    .then((realFilename) => {
      teamDataFilename = realFilename;
      event.sender.send('team-data-saved', realFilename);
    });
});

ipc.on('load-team-data', (event, filename) => {
  debug('on load-team-data called');
  files.loadTeamFile(filename)
    .then((dataObj) => {
      teamDataObj = dataObj;
      teamDataFilename = filename;
      event.sender.send('return-team-data', teamDataFilename, teamDataObj);
    });
});

ipc.on('get-team-data', (event) => {
  debug('on get-team-data called');
  event.sender.send('return-team-data', teamDataFilename, teamDataObj);
});

ipc.on('get-team-files', (event) => {
  debug('on get-team-files called');
  files.listTeamFiles()
    .then((teamFileData) => {
      event.sender.send('return-team-files', teamFileData);
    });
});

ipc.on('debug', (string) => {
  console.log(string);
});
