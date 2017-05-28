
'use strict';

const state = document.querySelector('.loading');

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
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 *
 * @return
 */
function detach() {
}

module.exports = {
  name: 'loading',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    stateManager: undefined
  }
};
