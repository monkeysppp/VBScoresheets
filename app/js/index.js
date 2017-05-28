'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const debug = require('./js/debug.js');
const stateManager = require('./js/state-manager.js').getStateManager();

// var Menu = remote.require('menu');

function init() {
  let closeEl = document.querySelector('.close');
  closeEl.addEventListener('click', () => {
    ipc.send('close-main-window');
  });

  stateManager.showState('loading');

  ipc.on('change-state', (event, from, to) => {
    debug('#index change state from ' + from + ' to ' + to);
    stateManager.showState(from, to);
  });

  debug('index page loaded');
  ipc.send('index-ready');
}

init();
