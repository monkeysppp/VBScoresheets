
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.pick-a-season');
const debug = require('../debug.js');

/**
 * teamDataListener - Handle when a specific team's data is loaded.  This effectively sets the view of
 * this page.
 *
 * @param  {object} event       IPC Event
 * @param  {string} filename    the filename that was loaded
 * @param  {object} teamDataObj the team data object that was loaded
 *
 * @private
 */
function teamDataListener(event, filename, teamDataObj) {
  let seasonList = document.getElementById('pick-a-season_list');
  // clean up any pre-existing content
  let cloneSeasonList = seasonList.cloneNode(false);
  seasonList.parentNode.replaceChild(cloneSeasonList, seasonList);
  seasonList = cloneSeasonList;

  teamDataObj.seasons.forEach((elem) => {
    let span = document.createElement('span');
    span.innerHTML = elem.name;
    span.className = 'list-item';
    span.onclick = () => {/* do something! */};
    seasonList.appendChild(span);
  });

  let i = document.createElement('input');
  i.id = 'input_pick-a-season';
  i.className = 'new-item-input';
  i.type = 'text';
  i.maxLength = 50;
  i.minlength = 1;
  i.placeholder = '2016/2017';
  i.size = 20;

  let b = document.createElement('button');
  b.className  = 'button new-item-button-disabled';
  b.id = 'button_pick-a-season';
  b.innerHTML = '+';
  b.onclick = () => {
    if (i.value.length > 0) {
      ipc.send('save-team-data', undefined, {name:i.value});
    }
  };

  i.oninput = () => {
    b.className = (i.value.length === 0) ? 'button new-item-button-disabled' : 'button new-item-button';
  };

  seasonList.appendChild(i);
  seasonList.appendChild(b);
}

/**
 * teamDataSavedListener - Listener for when a new season is saved, and we should
 * load that season as if it had been selected.
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename  the filename that was saved
 *
 * @private
 */
function teamDataSavedListener() {

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
  debug('attaching pick-a-season');
  ipc.on('return-team-data', teamDataListener);
  ipc.on('team-data-saved', teamDataSavedListener);
  ipc.send('get-team-data');
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 */
function detach() {
  debug('detaching pick-a-season');
  ipc.removeListener('return-team-data', teamDataListener);
  ipc.removeListener('team-data-saved', teamDataSavedListener);
}

module.exports = {
  name: 'pick-a-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamDataListener: teamDataListener,
    stateManager: undefined
  }
};
