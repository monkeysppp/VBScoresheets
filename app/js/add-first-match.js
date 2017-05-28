
'use strict';

const state = document.querySelector('.add-first-match');
const debug = require('./debug.js');

// var thisStateManager;

function init(/*stateManager*/) {
  // thisStateManager = stateManager;
}

function attach() {
  debug('attaching add-first-match');
}

function detach() {
  debug('detaching add-first-match');
}

module.exports = {
  name: 'add-first-match',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
