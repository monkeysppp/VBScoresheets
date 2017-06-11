
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.add-first-squad');
const debug = require('../debug.js');

/**
 * init - Initialize the page handler, ataching the state manager and discovering any interactive elements
 *
 * @param  {object} stateManager the state-manager for this state to send instructions to
 */
function init(stateManager) {
  if (!stateManager) {
    throw new Error('no state-manager given');
  }

  module.exports.internal.pageComplete = false;

  module.exports.internal.stateManager = stateManager;

  module.exports.internal.playerAddButton = document.getElementById('button_add-first-squad_add');
  module.exports.internal.playerName = document.getElementById('input_add-first-squad');
  module.exports.internal.playerList = document.getElementById('add-first-squad_list');
  module.exports.internal.doneButton = document.getElementById('button_add-first-squad_done');
  module.exports.internal.breadcrumb = document.getElementById('add-first-squad_breadcrumbs');

  module.exports.internal.playerAddButton.onclick = module.exports.internal.playerAddOnClick;
  module.exports.internal.playerName.oninput = module.exports.internal.playerNameOnInput;
  module.exports.internal.doneButton.onclick = module.exports.internal.doneOnClick;
}

/**
 * playerAddOnClick -A click handler for when the "add player" button is clicked.  This only
 * acts if the player name text value contains more than 0 characters.  The team data is saved
 * and the player list updated when this is clicked
 *
 * @private
 */
function playerAddOnClick() {
  if (module.exports.internal.playerName.value.length > 0) {
    if (!module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].players) {
      module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].players = [];
    }

    let player = {
      id: module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].players.length + 1,
      name: module.exports.internal.playerName.value
    };
    module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].players.push(player);

    debug('adding player ' + JSON.stringify(player));
    ipc.send('save-team-data', module.exports.internal.filename, module.exports.internal.dataObj);
  }
}

/**
 * playerNameOnInput - An on-input handler for the player name text field.  This greys out the
 * "add" button when there is no text in the player name.
 *
 * @private
 */
function playerNameOnInput() {
  if (module.exports.internal.playerName.value.length === 0) {
    module.exports.internal.playerAddButton.className = 'button new-item-button-disabled';
  } else {
    module.exports.internal.playerAddButton.className = 'button new-item-button';
  }
}

/**
 * doneOnClick - A click handler for when the done button is clicked.  This just changes the state
 * to the next page.
 *
 * @private
 */
function doneOnClick() {
  if (module.exports.internal.pageComplete) {
    module.exports.internal.stateManager.showState('add-first-squad', 'add-first-match');
  }
}

/**
 * teamSaveListener - React to team data being saved, by reloading team data
 *
 * @private
 */
function teamSaveListener() {
  debug('team data saved, reloading team data');
  ipc.send('get-team-data');
}

/**
 * teamGetListener - React to a request to get the known team data.  Populate the player list.
 * If the number of players is 6 or more then enable the done button.
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename the filename that was loaded
 * @param  {object} dataObj  the team data
 * @param  {number} seasonId the currently selected season
 *
 * @private
 */
function teamGetListener(event, filename, dataObj, seasonId) {
  debug('team data loaded');
  module.exports.internal.dataObj = dataObj;
  module.exports.internal.filename = filename;
  module.exports.internal.seasonId = seasonId;
  if (dataObj.seasons[seasonId].players.length >= 6) {
    module.exports.internal.pageComplete = true;
    module.exports.internal.doneButton.className = 'button done-button';
  } else {
    module.exports.internal.pageComplete = false;
    module.exports.internal.doneButton.className = 'button done-button-disabled';
  }

  // Clean up the input text box
  module.exports.internal.playerName.value = '';
  playerNameOnInput();

  // generate the breadcrumb
  module.exports.internal.generateBreadcrumb();

  // Clean up the list div
  let clonePlayerList = module.exports.internal.playerList.cloneNode(false);
  module.exports.internal.playerList.parentNode.replaceChild(clonePlayerList, module.exports.internal.playerList);
  module.exports.internal.playerList = clonePlayerList;

  dataObj.seasons[seasonId].players.forEach((player) => {
    let span = document.createElement('span');
    span.innerHTML = player.name;
    span.className = 'list-item';
    module.exports.internal.playerList.appendChild(span);
  });

  // Scroll to the bottom of the list
  module.exports.internal.playerList.scrollTop = module.exports.internal.playerList.scrollHeight;
}

/**
 * generateBreadcrumb - Generate the breadcrumb for this page:
 *  Home > $TeamName
 *
 * Home links back to pick a team.
 *
 * @private
 */
function generateBreadcrumb() {
  let cloneBreadcrumb = module.exports.internal.breadcrumb.cloneNode(false);
  module.exports.internal.breadcrumb.parentNode.replaceChild(cloneBreadcrumb, module.exports.internal.breadcrumb);
  module.exports.internal.breadcrumb = cloneBreadcrumb;

  let spanHome = document.createElement('span');
  spanHome.innerHTML = 'Home';
  spanHome.className = 'link';
  spanHome.onclick = () => {module.exports.internal.stateManager.showState('add-first-squad', 'pick-a-team');};
  module.exports.internal.breadcrumb.appendChild(spanHome);

  let spanSep1 = document.createElement('span');
  spanSep1.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep1);

  let spanTeam = document.createElement('span');
  spanTeam.innerHTML = module.exports.internal.dataObj.name;
  spanTeam.className = 'link';
  spanTeam.onclick = () => {module.exports.internal.stateManager.showState('add-first-squad', 'pick-a-season');};
  module.exports.internal.breadcrumb.appendChild(spanTeam);

  let spanSep2 = document.createElement('span');
  spanSep2.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep2);

  let spanSeason = document.createElement('span');
  spanSeason.innerHTML = module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].name;
  module.exports.internal.breadcrumb.appendChild(spanSeason);
}

/**
 * attach - Set up any event handlers
 */
function attach() {
  debug('attaching add-first-squad');
  ipc.on('team-data-saved', module.exports.internal.teamSaveListener);
  ipc.on('return-team-data', module.exports.internal.teamGetListener);
  ipc.send('get-team-data');
}

/**
 * detach - Clean up any event handlers
 */
function detach() {
  debug('detaching add-first-squad');
  ipc.removeListener('team-data-saved', module.exports.internal.teamSaveListener);
  ipc.removeListener('return-team-data', module.exports.internal.teamGetListener);
}

module.exports = {
  name: 'add-first-squad',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamSaveListener: teamSaveListener,
    teamGetListener: teamGetListener,
    playerAddOnClick: playerAddOnClick,
    playerNameOnInput: playerNameOnInput,
    doneOnClick: doneOnClick,
    generateBreadcrumb: generateBreadcrumb,
    stateManager: undefined,
    playerAddButton: undefined,
    playerName: undefined,
    playerList: undefined,
    doneButton: undefined,
    pageComplete: undefined,
    breadcrumb: undefined,
    filename: undefined,
    dataObj: undefined,
    seasonId: undefined
  }
};
