
'use strict';

const addFirstTeam = require('./add-first-team.js');
const addFirstSeason = require('./add-first-season.js');
const pickATeam = require('./pick-a-team.js');
const pickASeason = require('./pick-a-season.js');
const loading = require('./loading.js');

// const debug = require('debug')('vbs:state-manager');

const states = {
  'add-first-team': addFirstTeam,
  'pick-a-team': pickATeam,
  'add-first-season': addFirstSeason,
  'pick-a-season': pickASeason,
  loading: loading
};

function init(stateManager) {
  addFirstTeam.init(stateManager);
  addFirstSeason.init(stateManager);
  pickATeam.init(stateManager);
  pickASeason.init(stateManager);
  loading.init(stateManager);
}

function showState(from, to) {
  if (!to) {
    states[from].attach();
    states[from].state.style.display = 'block';
    return;
  }

  states[from].state.style.display = 'none';
  states[from].detach();
  states[to].attach();
  states[to].state.style.display = 'block';
}

module.exports = function() {
  let self = {
    showState: showState,
    states: states
  };

  init(self);

  return self;
};
