
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.add-first-team');
let thisStateManager;

const teamSaveListener = (/*event, filename*/) => {
  thisStateManager.showState('add-first-team', 'add-first-season');
};

function init(stateManager) {
  thisStateManager = stateManager;

  let teamAddedButton = document.getElementById('button_add-first-team');
  let teamName = document.getElementById('input_add-first-team');

  teamAddedButton.addEventListener('click', function () {
    ipc.send('save-team-file', undefined, {name:teamName.value});
  });
}

function attach() {
  ipc.on('team-file-saved', teamSaveListener);
}

function detach() {
  ipc.removeListener('team-file-saved', teamSaveListener);
}

module.exports = {
  name: 'add-first-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
