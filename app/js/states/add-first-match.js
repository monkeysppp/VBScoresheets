
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.add-first-match');
const debug = require('../debug.js');

/**
 * init - Initialize the page handler, ataching the state manager and discovering any interactive elements
 *
 * @param  {object} stateManager the state-manager for this state to send instructions to
 */
function init(stateManager) {
  if (!stateManager) {
    throw new Error('no state-manager given');
  }

  module.exports.internal.stateManager = stateManager;

  module.exports.internal.matchAddButton = document.getElementById('button_add-first-match_add');
  module.exports.internal.matchDate = document.getElementById('input_add-first-match_date');
  module.exports.internal.matchOpponent = document.getElementById('input_add-first-match_opponent');
  module.exports.internal.breadcrumb = document.getElementById('add-first-match_breadcrumbs');

  module.exports.internal.matchAddButton.onclick = module.exports.internal.matchAddOnClick;
  module.exports.internal.matchDate.oninput = module.exports.internal.matchInputOnInput;
  module.exports.internal.matchOpponent.oninput = module.exports.internal.matchInputOnInput;
}

/**
 * teamDataSavedListener - React to team data being saved, by storing the match id
 *
 * @private
 */
function teamDataSavedListener() {
  debug('team data saved, storing match selector');
  ipc.send('store-team-match', 0);
}

/**
 * teamMatchStoredListener - React to match selector being stored, by switching state to 'match-editor'
 *
 * @private
 */
function teamMatchStoredListener() {
  debug('team match selector stored, loading match-editor');
  module.exports.internal.stateManager.showState('add-first-match', 'match-editor');
}

/**
 * returnTeamDataListener - React to a request to get the known team data
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename the filename that was loaded
 * @param  {object} dataObj  the team data
 * @param  {number} seasonId the currently selected season
 *
 * @private
 */
function returnTeamDataListener(event, filename, dataObj, seasonId) {
  debug('team data loaded');
  module.exports.internal.filename = filename;
  module.exports.internal.dataObj = dataObj;
  module.exports.internal.seasonId = seasonId;

  // Clean up the input text box
  module.exports.internal.matchDate.value = '';
  module.exports.internal.matchOpponent.value = '';
  matchInputOnInput();

  // generate the breadcrumb
  module.exports.internal.generateBreadcrumb();
}

/**
 * matchAddOnClick - A click handler for when the "add match" button is clicked.  This only
 * acts if the match date is defined and match opponent text value contains more than 0 characters
 *
 * @private
 */
function matchAddOnClick() {
  if (module.exports.internal.matchDate.value.length !== 0 && module.exports.internal.matchOpponent.value.length !== 0) {
    module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].matches = [
      {
        id: 1,
        date: module.exports.internal.matchDate.value,
        home_or_away: 'home',
        squads: {
          opponent: {
            name: module.exports.internal.matchOpponent.value
          }
        }
      }
    ];
    debug('adding match ' + module.exports.internal.matchDate.value + ' ' + module.exports.internal.matchOpponent.value);
    ipc.send('save-team-data', module.exports.internal.filename, module.exports.internal.dataObj);
  }
}

/**
 * matchInputOnInput - An on-input handler for the match date and opponent fields.  This greys out the
 * "add" button when there is no complete date in the date field, or no complete opponent in the opponent
 * field.
 *
 * @private
 */
function matchInputOnInput() {
  if (module.exports.internal.matchDate.value.length === 0 || module.exports.internal.matchOpponent.value.length === 0) {
    module.exports.internal.matchAddButton.className = 'button new-item-button-disabled';
  } else {
    module.exports.internal.matchAddButton.className = 'button new-item-button';
  }
}

/**
 * generateBreadcrumb - Generate the breadcrumb for this page:
 *  Home > $TeamName > $SeasonName
 *
 * Home links back to pick a team.
 * $TeamName links back to pick a season
 *
 * @private
 */
function generateBreadcrumb() {
  let cloneBreadcrumb = module.exports.internal.breadcrumb.cloneNode(false);
  module.exports.internal.breadcrumb.parentNode.replaceChild(cloneBreadcrumb, module.exports.internal.breadcrumb);
  module.exports.internal.breadcrumb = cloneBreadcrumb;

  let spanHome = document.createElement('span');
  spanHome.innerHTML = 'Home';
  spanHome.className = 'link';
  spanHome.onclick = () => {module.exports.internal.stateManager.showState('add-first-match', 'pick-a-team');};
  module.exports.internal.breadcrumb.appendChild(spanHome);

  let spanSep1 = document.createElement('span');
  spanSep1.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep1);

  let spanTeam = document.createElement('span');
  spanTeam.innerHTML = module.exports.internal.dataObj.name;
  spanTeam.className = 'link';
  spanTeam.onclick = () => {module.exports.internal.stateManager.showState('add-first-match', 'pick-a-season');};
  module.exports.internal.breadcrumb.appendChild(spanTeam);

  let spanSep2 = document.createElement('span');
  spanSep2.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep2);

  let spanSeason = document.createElement('span');
  spanSeason.innerHTML = module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].name;
  module.exports.internal.breadcrumb.appendChild(spanSeason);
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
 */
function attach() {
  debug('attaching add-first-match');
  ipc.on('team-data-saved', module.exports.internal.teamDataSavedListener);
  ipc.on('team-match-stored', module.exports.internal.teamMatchStoredListener);
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener);
  ipc.send('get-team-data');
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach() {
  debug('detaching add-first-match');
  ipc.removeListener('team-data-saved', module.exports.internal.teamDataSavedListener);
  ipc.removeListener('team-match-stored', module.exports.internal.teamMatchStoredListener);
  ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener);
  return Promise.resolve();
}

module.exports = {
  name: 'add-first-match',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamDataSavedListener: teamDataSavedListener,
    teamMatchStoredListener: teamMatchStoredListener,
    returnTeamDataListener: returnTeamDataListener,
    matchAddOnClick: matchAddOnClick,
    matchInputOnInput: matchInputOnInput,
    generateBreadcrumb: generateBreadcrumb,
    stateManager: undefined,
    matchAddButton: undefined,
    matchDate: undefined,
    matchOpponent: undefined,
    breadcrumb: undefined,
    filename: undefined,
    dataObj: undefined
  }
};
