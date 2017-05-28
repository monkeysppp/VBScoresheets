
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.pick-a-team');
const debug = require('../debug.js');

function teamFilesListener(event, teamFileData) {
  let teamList = document.getElementById('pick-a-team_list');
  // clean up any pre-existing content
  let cloneTeamList = teamList.cloneNode(false);
  teamList.parentNode.replaceChild(cloneTeamList, teamList);
  teamList = cloneTeamList;

  teamFileData.forEach((elem) => {
    let p = document.createElement('span');
    p.innerHTML = elem.teamname;
    p.className = 'list-item';
    p.onclick = () => {pickFile(elem.filename, elem.teamname);};
    teamList.appendChild(p);
  });

  let i = document.createElement('input');
  i.id = 'input_add-team';
  i.className = 'new-item-input';
  i.type = 'text';
  i.maxLength = 50;
  i.minlength = 1;
  i.placeholder = 'Add Team';
  i.size = 20;

  let b = document.createElement('button');
  b.className  = 'button new-item-button-disabled';
  b.innerHTML = '+';
  b.onclick = () => {
    if (i.value.length > 0) {
      ipc.send('save-team-data', undefined, {name:i.value});
    }
  };

  i.oninput = () => {
    b.className = (i.value.length === 0) ? 'button new-item-button-disabled' : 'button new-item-button';
  };

  teamList.appendChild(i);
  teamList.appendChild(b);
}

function pickFile(filename) {
  ipc.send('load-team-data', filename);
}

function teamDataListener(event, filename, teamDataObj) {
  if (teamDataObj.seasons && teamDataObj.seasons.length > 0) {
    return module.exports.internal.stateManager.showState('pick-a-team', 'pick-a-season');
  }
  module.exports.internal.stateManager.showState('pick-a-team', 'add-first-season');
}
function teamDataSavedListener(event, filename) {
  pickFile(filename);
}

/**
 * init - description
 *
 * @param  {object} stateManager the state-manager for this state to send instructions to
 * @return
 */
function init(stateManager) {
  if (!stateManager) {
    throw new Error('no state-manager given');
  }

  module.exports.internal.stateManager = stateManager;
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
 *
 * @return
 */
function attach() {
  debug('attaching pick-a-team');
  ipc.on('return-team-files', teamFilesListener);
  ipc.on('team-data-saved', teamDataSavedListener);
  ipc.on('return-team-data', teamDataListener);
  ipc.send('get-team-files');
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 *
 * @return
 */
function detach() {
  debug('detaching pick-a-team');
  ipc.removeListener('return-team-files', teamFilesListener);
  ipc.removeListener('team-data-saved', teamDataSavedListener);
  ipc.removeListener('return-team-data', teamDataListener);
}

module.exports = {
  name: 'pick-a-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    stateManager: undefined
  }
};
