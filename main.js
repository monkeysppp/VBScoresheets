'use strict';

const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

const path = require('path');
const debug = require('debug')('vbs:main');
const debugUI = require('debug')('vbs:ui');
const files = require('./lib/files.js');

/**
 * mainWindowClose - handle the main window being closed and null the mainWindow
 */
function mainWindowClose() {
  module.exports.internal.mainWindow = null;
}

/**
 * createWindow - Create the main rendering window, load in our index.html
 * then register for a close event on the window
 *
 * @return {type}  description
 */
function createWindow() {
  debug('#createWindow creating main window');

  module.exports.internal.mainWindow = new BrowserWindow({
    frame: false,
    resizable: true,
    height: 500,
    minHeight: 500,
    width: 800,
    minWidth: 800,
    icon: path.join(__dirname, 'res/icons/png/64x64.png')
  });

  module.exports.internal.mainWindow.loadURL('file://' + __dirname + '/app/index.html');
  debug('main window created');

  module.exports.internal.mainWindow.on('closed', mainWindowClose);
}
app.on('ready', createWindow);

/**
 * windowAllClosedListener - Act on the window-all-closed event.
 * On OS X it is common for applications and their menu bar to stay
 * active until the user quits explicitly with Cmd + Q
 */
function windowAllClosedListener() {
  if (process.platform !== 'darwin') {
    app.quit();
  }
}
app.on('window-all-closed', windowAllClosedListener);

/**
 * activateListener - Act on the activate event.  On OS X it's common
 * to re-create a window in the app when the dock icon is clicked and
 * there are no other windows open.
 */
function activateListener() {
  if (module.exports.internal.mainWindow === null) {
    module.exports.internal.createWindow();
  }
}
app.on('activate', activateListener);

/**
 * indexReadyListener - React to the index page load completing,
 * so we can start launching stuff.  This will try to get the list of team files.
 * If there are no files, send a change-state event to draw the 'add-fisrt-team' page
 * If there are files, send a change-state event to draw the 'pick-a-team' page
 *
 * @param  {object} event IPC Event
 * @return {Promise}  A promise to a list of files and teams
 */
function indexReadyListener(event) {
  return files.listTeamFiles()
    .then((filelist) => {
      debug('#createWindow got file list');
      if (filelist.length === 0) {
        event.sender.send('change-state', 'loading', 'add-first-team');
        debug('#createWindow drawing addFirstTeam');
      } else {
        event.sender.send('change-state', 'loading', 'pick-a-team');
        debug('#createWindow drawing pickATeam');
      }
    })
    .catch((err) => {
      // TODO - what do I do with the error!!!
      debug(err.toString());
    });
}
ipc.on('index-ready', indexReadyListener);

/**
 * closeMainWindowListener - react to close-main-window and call quit.
 */
function closeMainWindowListener() {
  debug('on close-main-window called');
  app.quit();
}
ipc.on('close-main-window', closeMainWindowListener);

/**
 * getTeamFilesListener - Get the list of teams and their files.  This returns
 * a promise to an array of {filename: x, teamname: x} objects.
 *
 * @param  {object} event  IPC Event
 * @return {Promise}  A promise to a list of files and teams
 */
function getTeamFilesListener(event) {
  debug('on get-team-files called');
  return files.listTeamFiles()
    .then((teamFileData) => {
      event.sender.send('return-team-files', teamFileData);
    })
    .catch((err) => {
      // TODO - what do I do with the error!!!
      debug(err.toString());
    });
}
ipc.on('get-team-files', getTeamFilesListener);

/**
 * saveTeamDataListener - description
 *
 * @param  {object} event  IPC Event
 * @param  {string} filename description
 * @param  {object} data     description
 * @return {Promise}  A promise to have save the data to file
 */
function saveTeamDataListener(event, filename, data) {
  debug('on save-team-data called on file ' + filename + ' for team ' + data.name);
  return files.saveTeamFile(filename, data)
    .then((realFilename) => {
      module.exports.internal.teamData = data;
      module.exports.internal.teamFilename = realFilename;
      event.sender.send('team-data-saved', realFilename);
    })
    .catch((err) => {
      // TODO - what do I do with the error!!!
      debug(err.toString());
    });
}
ipc.on('save-team-data', saveTeamDataListener);

/**
 * loadTeamDataListener - loads the requested team file,
 * then returns the filename and data from the team file.
 *
 * @param  {object} event  IPC Event
 * @param  {number} filename name of the team file to load
 * @return {Promise}  A promise to have reported the loaded data
 */
function loadTeamDataListener(event, filename) {
  debug('on load-team-data called');
  return files.loadTeamFile(filename)
    .then((data) => {
      module.exports.internal.teamData = data;
      module.exports.internal.teamFilename = filename;
      module.exports.internal.teamSeason = undefined;
      module.exports.internal.teamMatch = undefined;
      module.exports.internal.teamPlayer = undefined;
      event.sender.send('return-team-data',
        module.exports.internal.teamFilename,
        module.exports.internal.teamData);
    })
    .catch((err) => {
      // TODO - what do I do with the error!!!
      debug(err.toString());
    });
}
ipc.on('load-team-data', loadTeamDataListener);

/**
 * storeTeamSeasonListener - stores the selected season's id.  This then sends
 * an acknowledgement event on the channel 'team-season-stored'.
 *
 * @param  {object} event  IPC Event
 * @param  {number} season The id of the season selected
 */
function storeTeamSeasonListener(event, season) {
  debug('on store-team-season called with ' + season);
  module.exports.internal.teamSeason = season;
  event.sender.send('team-season-stored', season);
}
ipc.on('store-team-season', storeTeamSeasonListener);

/**
 * storeTeamMatchListener - stores the selected match's id.  This then sends
 * an acknowledgement event on the channel 'team-match-stored'.
 *
 * @param  {object} event  IPC Event
 * @param  {number} match  The id of the match selected
 */
function storeTeamMatchListener(event, match) {
  debug('on store-team-match called with ' + match);
  module.exports.internal.teamMatch = match;
  event.sender.send('team-match-stored', match);
}
ipc.on('store-team-match', storeTeamMatchListener);

/**
 * storeTeamPlayerListener - stores the selected player's id.  This then sends
 * an acknowledgement event on the channel 'team-player-stored'.
 *
 * @param  {object} event  IPC Event
 * @param  {number} player The id of the player selected
 */
function storeTeamPlayerListener(event, player) {
  debug('on store-team-player called with ' + player);
  module.exports.internal.teamPlayer = player;
  event.sender.send('team-player-stored', player);
}
ipc.on('store-team-player', storeTeamPlayerListener);

/**
 * getTeamDataListener - Return the currently stored team data and any
 * selectors such as the selected season or player.
 *
 * @param  {object} event IPC Event
 */
function getTeamDataListener(event) {
  debug('on get-team-data called');
  event.sender.send('return-team-data',
    module.exports.internal.teamFilename,
    module.exports.internal.teamData,
    module.exports.internal.teamSeason,
    module.exports.internal.teamMatch,
    module.exports.internal.teamPlayer);
}
ipc.on('get-team-data', getTeamDataListener);

/**
 * reportDebugUI - Pipe a debug message from the UI to the 'ui-debug' debug output.
 *
 * @param  {object} event  IPC Event
 * @param  {string} string The message to pipe to debug output
 */
function reportDebugUI(event, string) {
  debugUI(string);
}
ipc.on('ui-debug', reportDebugUI);

module.exports = {
  internal: {
    mainWindow: null,
    teamData: undefined,
    teamFilename: undefined,
    teamSeason: undefined,
    teamMatch: undefined,
    teamPlayer: undefined,
    mainWindowClose: mainWindowClose,
    windowAllClosedListener: windowAllClosedListener,
    activateListener: activateListener,
    indexReadyListener: indexReadyListener,
    closeMainWindowListener: closeMainWindowListener,
    getTeamFilesListener: getTeamFilesListener,
    saveTeamDataListener: saveTeamDataListener,
    loadTeamDataListener: loadTeamDataListener,
    storeTeamSeasonListener: storeTeamSeasonListener,
    storeTeamMatchListener: storeTeamMatchListener,
    storeTeamPlayerListener: storeTeamPlayerListener,
    getTeamDataListener: getTeamDataListener,
    reportDebugUI: reportDebugUI,
    createWindow: createWindow
  }
};
