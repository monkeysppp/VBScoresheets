
'use strict';

const state = document.querySelector('.add-first-season');
const debug = require('../debug.js');

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
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
 *
 * @return
 */
function attach() {
  debug('attaching add-first-season');
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 *
 * @return
 */
function detach() {
  debug('detaching add-first-season');
}

module.exports = {
  name: 'add-first-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    stateManager: undefined
  }
};
