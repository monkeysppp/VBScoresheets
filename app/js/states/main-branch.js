
'use strict';

const state = document.querySelector('.main-branch');
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

  module.exports.internal.players = document.getElementById('main-branch_players');
  module.exports.internal.matches = document.getElementById('main-branch_matches');
  module.exports.internal.seasons = document.getElementById('main-branch_season');

  module.exports.internal.players.onclick = module.exports.internal.playersOnClick;
  module.exports.internal.matches.onclick = module.exports.internal.matchesOnClick;
  module.exports.internal.seasons.onclick = module.exports.internal.seasonsOnClick;
}

/**
 * playersOnClick - Show the state 'pick-a-player'
 *
 * @private
 */
function playersOnClick() {
  module.exports.internal.stateManager.showState('main-branch', 'pick-a-player');
}

/**
 * matchesOnClick - Show the state 'pick-a-match'
 *
 * @private
 */
function matchesOnClick() {
  module.exports.internal.stateManager.showState('main-branch', 'pick-a-match');
}

/**
 * seasonsOnClick - Show the state 'season-stats'
 *
 * @private
 */
function seasonsOnClick() {
  module.exports.internal.stateManager.showState('main-branch', 'season-stats');
}

/**
 * attach - Set up any event handlers
 */
function attach() {
  debug('attaching main-branch');
}

/**
 * detach - Clean up any event handlers
 */
function detach() {
  debug('attaching main-branch');
}

module.exports = {
  name: 'main-branch',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    playersOnClick: playersOnClick,
    matchesOnClick: matchesOnClick,
    seasonsOnClick: seasonsOnClick,
    stateManager: undefined,
    players: undefined,
    teams: undefined,
    seasons: undefined
  }
};
