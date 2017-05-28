
'use strict';

const addFirstTeam = require('./states/add-first-team.js');
const addFirstSeason = require('./states/add-first-season.js');
const addFirstMatch = require('./states/add-first-match.js');
const pickATeam = require('./states/pick-a-team.js');
const pickASeason = require('./states/pick-a-season.js');
const pickAMatch = require('./states/pick-a-match.js');
const loading = require('./states/loading.js');

let self;

const debug = require('./debug.js');

let states = {};
states[addFirstTeam.name] = addFirstTeam;
states[pickATeam.name] = pickATeam;
states[addFirstSeason.name] = addFirstSeason;
states[pickASeason.name] = pickASeason;
states[addFirstMatch.name] = addFirstMatch;
states[pickAMatch.name] = pickAMatch;
states[loading.name] = loading;


/**
 * init - Initialize all of the states in the state manager
 *
 * @param  {object} stateManager a bit like a this
 * @return
 */
function init(stateManager) {
  addFirstTeam.init(stateManager);
  addFirstSeason.init(stateManager);
  addFirstMatch.init(stateManager);
  pickATeam.init(stateManager);
  pickASeason.init(stateManager);
  pickAMatch.init(stateManager);
  loading.init(stateManager);
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
 * @return
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
