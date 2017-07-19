
'use strict';

// const electron = require('electron');
// const ipc = electron.ipcRenderer;

const state = document.querySelector('.season-stats');
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

  let breadcrumb = document.getElementById('season-stats_breadcrumbs');
  let spanHome = document.createElement('span');
  spanHome.innerHTML = 'Home';
  spanHome.className = 'link';
  spanHome.onclick = () => {stateManager.showState('season-stats', 'pick-a-team');};
  breadcrumb.appendChild(spanHome);
}

/**
 * attach - Set up any event handlers
 */
function attach() {
  debug('attaching season-stats');
}

/**
 * detach - Clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach() {
  debug('attaching season-stats');
  return Promise.resolve();
}

module.exports = {
  name: 'season-stats',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    stateManager: undefined,
  }
};
