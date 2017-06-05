
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
    let span = document.createElement('span');
    span.innerHTML = elem.teamname;
    span.className = 'list-item';
    span.onclick = () => {module.exports.internal.pickFile(elem.filename, elem.teamname);};
    teamList.appendChild(span);
  });

  // TODO - move the add out of the scrollable
  let i = document.createElement('input');
  i.id = 'input_pick-a-team';
  i.className = 'new-item-input';
  i.type = 'text';
  i.maxLength = 50;
  i.minlength = 1;
  i.placeholder = 'Add Team';
  i.size = 20;

  let b = document.createElement('button');
  b.className  = 'button new-item-button-disabled';
  b.id = 'button_pick-a-team';
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


/**
 * pickFile - sends a load-team-data event for the given filename.
 *
 * @param  {string} filename name of the file to load
 * @private
 */
function pickFile(filename) {
  ipc.send('load-team-data', filename);
}

/**
 * teamDataListener - Handle when a specific team's data is loaded.  This is done in reaction
 * to selecting a team, which is done via pickFile()
 *
 * @param  {object} event       IPC Event
 * @param  {string} filename    the filename that was loaded
 * @param  {object} teamDataObj the team data object that was loaded
 * @private
 */
function teamDataListener(event, filename, teamDataObj) {
  if (teamDataObj.seasons && teamDataObj.seasons.length > 0) {
    return module.exports.internal.stateManager.showState('pick-a-team', 'pick-a-season');
  }
  module.exports.internal.stateManager.showState('pick-a-team', 'add-first-season');
}


/**
 * teamDataSavedListener - Listener for when a new team is saved, and we should
 * load that file as if it had been selected.
 *
 * @param  {object} event    IPC Event
 * @param  string} filename  the filename that was saved
 * @private
 */
function teamDataSavedListener(event, filename) {
  module.exports.internal.pickFile(filename);
}

/**
 * init - description
 *
 * @param  {object} stateManager the state-manager for this state to send instructions to
 */
function init(stateManager) {
  if (!stateManager) {
    throw new Error('no state-manager given');
  }

  module.exports.internal.stateManager = stateManager;
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
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
    teamFilesListener: teamFilesListener,
    teamDataSavedListener: teamDataSavedListener,
    teamDataListener: teamDataListener,
    pickFile: pickFile,
    stateManager: undefined
  }
};
