
'use strict';

const addFirstTeam = require('./add-first-team.js');
const addFirstSeason = require('./add-first-season.js');
const addFirstMatch = require('./add-first-match.js');
const pickATeam = require('./pick-a-team.js');
const pickASeason = require('./pick-a-season.js');
const pickAMatch = require('./pick-a-match.js');
const loading = require('./loading.js');

let self;

const debug = require('./debug.js');

const states = {
  'add-first-team': addFirstTeam,
  'pick-a-team': pickATeam,
  'add-first-season': addFirstSeason,
  'pick-a-season': pickASeason,
  'add-first-match': addFirstMatch,
  'pick-a-match': pickAMatch,
  loading: loading
};

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
