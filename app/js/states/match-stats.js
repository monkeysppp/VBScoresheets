
'use strict';

// const electron = require('electron');
// const ipc = electron.ipcRenderer;

const state = document.querySelector('.match-stats');
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
  debug('attaching match-stats');
}

/**
 * detach - Clean up any event handlers
 */
function detach() {
  debug('attaching match-stats');
}

module.exports = {
  name: 'match-stats',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    stateManager: undefined,
  }
};
