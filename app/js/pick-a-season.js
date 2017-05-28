
'use strict';

const state = document.querySelector('.pick-a-season');
const debug = require('./debug.js');

// var thisStateManager;

function init(/*stateManager*/) {
  // thisStateManager = stateManager;
}

function attach() {
  debug('attaching pick-a-season');
}

function detach() {
  debug('detaching pick-a-season');
}

module.exports = {
  name: 'pick-a-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
