
'use strict';

// const electron = require('electron');
// const ipc = electron.ipcRenderer;

const state = document.querySelector('.pick-a-player');
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
}

/**
 * attach - Set up any event handlers
 */
function attach() {
  debug('attaching pick-a-player');
}

/**
 * detach - Clean up any event handlers
 */
function detach() {
  debug('attaching pick-a-player');
}

module.exports = {
  name: 'pick-a-player',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    stateManager: undefined,
  }
};
