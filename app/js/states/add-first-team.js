
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.add-first-team');
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

  module.exports.internal.teamAddButton = document.getElementById('button_add-first-team_add');
  module.exports.internal.teamName = document.getElementById('input_add-first-team');

  module.exports.internal.teamAddButton.onclick = module.exports.internal.teamAddOnClick;
  module.exports.internal.teamName.oninput = module.exports.internal.teamNameOnInput;
}

/**
 * teamDataSavedListener - React to team data being saved, by switching state to 'add-first-season'
 *
 * @private
 */
function teamDataSavedListener() {
  module.exports.internal.stateManager.showState('add-first-team', 'add-first-season');
}

/**
 * teamAddOnClick - A click handler for when the "add team" button is clicked.  This only
 * acts if the team name text value contains more than 0 characters
 *
 * @private
 */
function teamAddOnClick() {
  if (module.exports.internal.teamName.value.length > 0) {
    ipc.send('save-team-data', undefined, {name:module.exports.internal.teamName.value});
  }
}

/**
 * teamNameOnInput - An on-input handler for the team name text field.  This greys out the
 * "add" button when there is no text in the team name.
 *
 * @private
 */
function teamNameOnInput() {
  if (module.exports.internal.teamName.value.length === 0) {
    module.exports.internal.teamAddButton.className = 'button new-item-button-disabled';
  } else {
    module.exports.internal.teamAddButton.className = 'button new-item-button';
  }
}

/**
 * attach - Set up any event handlers
 */
function attach() {
  debug('attaching add-first-team');
  ipc.on('team-data-saved', teamDataSavedListener);
}

/**
 * detach - Clean up any event handlers
 */
function detach() {
  debug('attaching add-first-team');
  ipc.removeListener('team-data-saved', teamDataSavedListener);
}

module.exports = {
  name: 'add-first-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamDataSavedListener: teamDataSavedListener,
    teamAddOnClick: teamAddOnClick,
    teamNameOnInput: teamNameOnInput,
    stateManager: undefined,
    teamAddButton: undefined,
    teamName: undefined
  }
};
