
'use strict';

const state = document.querySelector('.pick-a-match');
const debug = require('./debug.js');

// var thisStateManager;

function init(/*stateManager*/) {
  // thisStateManager = stateManager;
}

function attach() {
  debug('attaching pick-a-match');
}

function detach() {
  debug('detaching pick-a-match');
}

module.exports = {
  name: 'pick-a-match',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
