
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.add-first-season');
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

  module.exports.internal.stateManager = stateManager;

  module.exports.internal.seasonAddButton = document.getElementById('button_add-first-season_add');
  module.exports.internal.seasonName = document.getElementById('input_add-first-season');

  module.exports.internal.seasonAddButton.onclick = module.exports.internal.seasonAddOnClick;
  module.exports.internal.seasonName.oninput = module.exports.internal.seasonNameOnInput;
}

/**
 * teamSaveListener - React to team data being saved, by storing the season id
 *
 * @private
 */
function teamSaveListener() {
  debug('team data saved, storing season selector');
  ipc.send('store-team-season', 0);
}

/**
 * teamSeasonStoreListener - React to season selector being stored, by switching state to 'add-first-squad'
 *
 * @private
 */
function teamSeasonStoreListener() {
  debug('team season selector stored, loading add-first-squad');
  module.exports.internal.stateManager.showState('add-first-season', 'add-first-squad');
}

/**
 * teamGetListener - React to a request to get the known team data
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename the filename that was loaded
 * @param  {object} dataObj  the team data
 *
 * @private
 */
function teamGetListener(event, filename, dataObj) {
  debug('team data loaded');
  module.exports.internal.filename = filename;
  module.exports.internal.dataObj = dataObj;
}

/**
 * seasonAddOnClick - A click handler for when the "add season" button is clicked.  This only
 * acts if the season name text value contains more than 0 characters
 *
 * @private
 */
function seasonAddOnClick() {
  if (module.exports.internal.seasonName.value.length > 0) {
    module.exports.internal.dataObj.seasons = [
      {
        name: module.exports.internal.seasonName.value
      }
    ];
    debug('adding season ' + module.exports.internal.seasonName.value);
    ipc.send('save-team-data', module.exports.internal.filename, module.exports.internal.dataObj);
  }
}

/**
 * seasonNameOnInput - An on-input handler for the season name text field.  This greys out the
 * "add" button when there is no text in the season name.
 *
 * @private
 */
function seasonNameOnInput() {
  if (module.exports.internal.seasonName.value.length === 0) {
    module.exports.internal.seasonAddButton.className = 'button new-item-button-disabled';
  } else {
    module.exports.internal.seasonAddButton.className = 'button new-item-button';
  }
}

/**
 * attach - Set up any event handlers
 */
function attach() {
  debug('attaching add-first-season');
  ipc.on('team-data-saved', module.exports.internal.teamSaveListener);
  ipc.on('team-season-stored', module.exports.internal.teamSeasonStoreListener);
  ipc.on('return-team-data', module.exports.internal.teamGetListener);
  ipc.send('get-team-data');
}

/**
 * detach - Clean up any event handlers
 */
function detach() {
  debug('detaching add-first-season');
  ipc.removeListener('team-data-saved', module.exports.internal.teamSaveListener);
  ipc.removeListener('team-season-stored', module.exports.internal.teamSeasonStoreListener);
  ipc.removeListener('return-team-data', module.exports.internal.teamGetListener);
}

module.exports = {
  name: 'add-first-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamSaveListener: teamSaveListener,
    teamSeasonStoreListener: teamSeasonStoreListener,
    teamGetListener: teamGetListener,
    seasonAddOnClick: seasonAddOnClick,
    seasonNameOnInput: seasonNameOnInput,
    stateManager: undefined,
    seasonAddButton: undefined,
    seasonName: undefined,
    filename: undefined,
    dataObj: undefined
  }
};
