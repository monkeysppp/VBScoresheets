
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.add-first-team');
const debug = require('../debug.js');

const teamSaveListener = () => {
  module.exports.internal.stateManager.showState('add-first-team', 'add-first-season');
};

/**
 * init - description
 *
 * @param  {object} stateManager the state-manager for this state to send instructions to
 * @return
 */
function init(stateManager) {
  if (!stateManager) {
    throw new Error('no state-manager given');
  }

  module.exports.internal.stateManager = stateManager;

  let teamAddedButton = document.getElementById('button_add-first-team');
  let teamName = document.getElementById('input_add-first-team');

  teamAddedButton.onclick = () => {
    if (teamName.value.length > 0) {
      ipc.send('save-team-data', undefined, {name:teamName.value});
    }
  };
  teamName.oninput = () => {
    teamAddedButton.className = (teamName.value.length === 0) ? 'button new-item-button-disabled' : 'button new-item-button';
  };
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
 *
 * @return
 */
function attach() {
  debug('attaching add-first-team');
  ipc.on('team-data-saved', teamSaveListener);
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 *
 * @return
 */
function detach() {
  debug('attaching add-first-team');
  ipc.removeListener('team-data-saved', teamSaveListener);
}

module.exports = {
  name: 'add-first-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamSaveListener: teamSaveListener,
    stateManager: undefined
  }
};
