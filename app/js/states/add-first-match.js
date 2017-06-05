
'use strict';

const state = document.querySelector('.add-first-match');
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
 * attach - attach the state code to the displayed ui and set up any event handlers
 */
function attach() {
  debug('attaching add-first-match');
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 */
function detach() {
  debug('detaching add-first-match');
}

module.exports = {
  name: 'add-first-match',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    stateManager: undefined
  }
};
