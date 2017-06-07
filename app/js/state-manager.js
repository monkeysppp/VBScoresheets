
'use strict';

const addFirstMatch = require('./states/add-first-match.js');
const addFirstSeason = require('./states/add-first-season.js');
const addFirstSquad = require('./states/add-first-squad.js');
const addFirstTeam = require('./states/add-first-team.js');
const loading = require('./states/loading.js');
const mainBranch = require('./states/main-branch.js');
const matchStats = require('./states/match-stats.js');
const pickAMatch = require('./states/pick-a-match.js');
const pickAPlayer = require('./states/pick-a-player.js');
const pickASeason = require('./states/pick-a-season.js');
const pickATeam = require('./states/pick-a-team.js');
const playerStats = require('./states/player-stats.js');
const seasonStats = require('./states/season-stats.js');

let self;

const debug = require('./debug.js');

let states = {};
states[addFirstMatch.name] = addFirstMatch;
states[addFirstSeason.name] = addFirstSeason;
states[addFirstSquad.name] = addFirstSquad;
states[addFirstTeam.name] = addFirstTeam;
states[loading.name] = loading;
states[mainBranch.name] = mainBranch;
states[matchStats.name] = matchStats;
states[pickAMatch.name] = pickAMatch;
states[pickAPlayer.name] = pickAPlayer;
states[pickASeason.name] = pickASeason;
states[pickATeam.name] = pickATeam;
states[playerStats.name] = playerStats;
states[seasonStats.name] = seasonStats;

/**
 * init - Initialize all of the states in the state manager
 *
 * @param  {object} stateManager a bit like a this
 * @private
 */
function init(stateManager) {
  addFirstMatch.init(stateManager);
  addFirstSeason.init(stateManager);
  addFirstSquad.init(stateManager);
  addFirstTeam.init(stateManager);
  loading.init(stateManager);
  mainBranch.init(stateManager);
  matchStats.init(stateManager);
  pickAMatch.init(stateManager);
  pickAPlayer.init(stateManager);
  pickASeason.init(stateManager);
  pickATeam.init(stateManager);
  playerStats.init(stateManager);
  seasonStats.init(stateManager);
}

/**
 * showState - swap the css display properties to make one state disappear and another appear,
 * calling detach on the disappearing state and attach on the appearing one.
 *
 * If this is called with one state, that state is turned on BUT the old state is not turned off.
 * This must only be done for turning on the first ever state.
 *
 * @param  {string} from name of the state to remove
 * @param  {string} to   name of the state to display
 */
function showState(from, to) {
  if (!to) {
    debug('state-manager changing state to ' + to);
    this.states[from].attach();
    this.states[from].state.style.display = 'block';
    return;
  }

  debug('state-manager changing state from ' + from + ' to ' + to);
  this.states[from].state.style.display = 'none';
  this.states[from].detach();
  this.states[to].attach();
  this.states[to].state.style.display = 'block';
}

/**
 * getStateManager - Return a state manager object
 *
 * @return {object}  A state manager
 */
function getStateManager() {
  if (!self) {
    debug('creating the state-manager');
    self = {
      showState: showState,
      states: states
    };

    module.exports.internal.init(self);
  }

  return self;
}

module.exports = {
  getStateManager: getStateManager,
  internal: {
    init: init
  }
};
