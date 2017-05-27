'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

// var debug = require('debug')('vbs:index');
const stateManager = require('./js/state-manager.js')();

// var Menu = remote.require('menu');

function init() {
  let closeEl = document.querySelector('.close');
  closeEl.addEventListener('click', function () {
    ipc.send('close-main-window');
  });

  stateManager.showState('loading');

  ipc.on('change-state', (event, from, to) => {
    // console.log('log', '#index change state from ' + from + ' to ' + to);
    stateManager.showState(from, to);
  });

  // ipc.send('debug', 'index page loaded');
  ipc.send('index-ready');
}

init();
