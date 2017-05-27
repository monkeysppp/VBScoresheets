
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.pick-a-team');

// var thisStateManager;

function teamFilesListener(event, teamFileData) {
  let teamList = document.getElementById('pick-a-team_list');
  // clean up any pre-existing content
  let cloneTeamList = teamList.cloneNode(false);
  teamList.parentNode.replaceChild(cloneTeamList, teamList);
  teamList = cloneTeamList;

  teamFileData.forEach((elem) => {
    let p = document.createElement('p');
    p.innerHTML = elem.teamname;
    p.onclick = () => {pickFile(elem.filename, elem.teamname);};
    teamList.appendChild(p);
  });

  let i = document.createElement('input');
  i.id = 'input_add-team';
  i.class = 'new-item-input';
  i.type = 'text';
  i.maxLength = 50;
  i.minlength = 1;
  i.placeholder = 'Add Team';
  i.size = 20;
  teamList.appendChild(i);

  let b = document.createElement('button');
  b.class  = 'button new-item-button';
  b.id = 'button_add-first-team';
  b.innerHTML = '+';
  b.onclick = () => {ipc.send('save-team-data', undefined, {name:i.value});};
  teamList.appendChild(b);
}

function pickFile(/*filename, teamname*/) {

}

function init(/*stateManager*/) {
  // thisStateManager = stateManager;

}

function attach() {
  ipc.on('return-team-files', teamFilesListener);
  ipc.send('get-team-files');
}

function detach() {
  ipc.removeListener('return-team-files', teamFilesListener);
}

module.exports = {
  name: 'pick-a-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach
};
