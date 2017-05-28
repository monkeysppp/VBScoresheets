
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.add-first-season');
const debug = require('../debug.js');

const teamSaveListener = () => {
  module.exports.internal.stateManager.showState('add-first-season', 'add-first-match');
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

  let seasonAddedButton = document.getElementById('button_add-first-season');
  let seasonName = document.getElementById('input_add-first-season');

  seasonAddedButton.onclick = () => {
    if (seasonName.value.length > 0) {
      ipc.send('save-team-data', undefined, {name:seasonName.value});
    }
  };
  seasonName.oninput = () => {
    seasonAddedButton.className = (seasonName.value.length === 0) ? 'button new-item-button-disabled' : 'button new-item-button';
  };
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
 *
 * @return
 */
function attach() {
  debug('attaching add-first-season');
  ipc.on('team-data-saved', teamSaveListener);
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 *
 * @return
 */
function detach() {
  debug('detaching add-first-season');
  ipc.removeListener('team-data-saved', teamSaveListener);
}

module.exports = {
  name: 'add-first-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamSaveListener: teamSaveListener,
    stateManager: undefined
  }
};
