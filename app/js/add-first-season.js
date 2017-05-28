
'use strict';

const state = document.querySelector('.add-first-season');
const debug = require('./debug.js');

// var thisStateManager;

function init(/*stateManager*/) {
  // thisStateManager = stateManager;
}

function attach() {
  debug('attaching add-first-season');
}

function detach() {
  debug('detaching add-first-season');
}

module.exports = {
  name: 'add-first-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
