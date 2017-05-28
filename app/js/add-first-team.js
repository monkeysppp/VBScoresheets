
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

  teamAddedButton.onclick = () => {
    if (teamName.value.length > 0) {
      ipc.send('save-team-data', undefined, {name:teamName.value});
    }
  };
  teamName.oninput  = () => {
    teamAddedButton.className = (teamName.value.length === 0) ? 'button new-item-button-disabled' : 'button new-item-button';
  };
}

function attach() {
  ipc.on('team-data-saved', teamSaveListener);
}

function detach() {
  ipc.removeListener('team-data-saved', teamSaveListener);
}

module.exports = {
  name: 'add-first-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
