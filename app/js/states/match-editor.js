
'use strict';

const electron = require('electron');
const ipc = electron.ipcRenderer;

const state = document.querySelector('.match-editor');
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

  module.exports.internal.matchVenue = document.getElementById('input_match-editor_venue');
  module.exports.internal.matchDate = document.getElementById('input_match-editor_date');
  module.exports.internal.matchTime = document.getElementById('input_match-editor_time');
  module.exports.internal.matchTeamNamesUs = document.getElementById('input_match-editor_team-heading-us');
  module.exports.internal.matchTeamNamesThem = document.getElementById('input_match-editor_team-heading-them');
  module.exports.internal.breadcrumb = document.getElementById('match-editor_breadcrumbs');
}

/**
 * returnTeamDataListener - React to a request to get the known team data
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename the filename that was loaded
 * @param  {object} dataObj  the team data
 * @param  {number} seasonId the currently selected season
 * @param  {number} matchId  the id of the currently selected match
 *
 * @private
 */
function returnTeamDataListener(event, filename, dataObj, seasonId, matchId) {
  debug('team data loaded for season ' + seasonId);
  module.exports.internal.filename = filename;
  module.exports.internal.dataObj = dataObj;
  module.exports.internal.seasonId = seasonId;
  module.exports.internal.matchId = matchId;
  module.exports.internal.findMatch();

  debug('team data loaded for season called ' + dataObj.seasons[seasonId].name +
    ' and matchId ' + matchId + ' on ' + module.exports.internal.matchData.date + ' against ' +
    module.exports.internal.matchData.squads.opponent.name);

  // generate the breadcrumb
  module.exports.internal.generateBreadcrumb();

  // Populate the values when known
  module.exports.internal.matchDate.value = module.exports.internal.matchData.date;
  module.exports.internal.matchTeamNamesUs.innerHTML = module.exports.internal.dataObj.name;
  module.exports.internal.matchTeamNamesThem.innerHTML = module.exports.internal.matchData.squads.opponent.name;

  if (module.exports.internal.matchData.venue) {
    module.exports.internal.matchVenue.value = module.exports.internal.matchData.venue;
  } else {
    module.exports.internal.matchVenue.value = '';
  }

  if (module.exports.internal.matchData.time) {
    module.exports.internal.matchTime.value = module.exports.internal.matchData.time;
  } else {
    module.exports.internal.matchTime.value = '';
  }
}


/**
 * findMatch - Search through the match array and find the one with an id matchign matchId,
 * then sotre a handle to that match.
 */
function findMatch() {
  module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].matches.forEach((match) => {
    if (match.id === module.exports.internal.matchId) {
      module.exports.internal.matchData = match;
    }
  });
}

/**
 * generateBreadcrumb - Generate the breadcrumb for this page:
 *  Home > $TeamName > $SeasonName > Matches > $MatchDate $matchOpponent
 *
 * Home links back to pick a team.
 * $TeamName links back to pick a season
 * $SeasonName links back to main branch
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
  spanHome.onclick = () => {module.exports.internal.stateManager.showState('match-editor', 'pick-a-team');};
  module.exports.internal.breadcrumb.appendChild(spanHome);

  let spanSep1 = document.createElement('span');
  spanSep1.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep1);

  let spanTeam = document.createElement('span');
  spanTeam.innerHTML = module.exports.internal.dataObj.name;
  spanTeam.className = 'link';
  spanTeam.onclick = () => {module.exports.internal.stateManager.showState('match-editor', 'pick-a-season');};
  module.exports.internal.breadcrumb.appendChild(spanTeam);

  let spanSep2 = document.createElement('span');
  spanSep2.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep2);

  let spanSeason = document.createElement('span');
  spanSeason.innerHTML = module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].name;
  spanSeason.className = 'link';
  spanSeason.onclick = () => {module.exports.internal.stateManager.showState('match-editor', 'main-branch');};
  module.exports.internal.breadcrumb.appendChild(spanSeason);

  let spanSep3 = document.createElement('span');
  spanSep3.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep3);

  let spanMatches = document.createElement('span');
  spanMatches.innerHTML = 'Matches';
  spanMatches.className = 'link';
  spanMatches.onclick = () => {module.exports.internal.stateManager.showState('match-editor', 'pick-a-match');};
  module.exports.internal.breadcrumb.appendChild(spanMatches);

  let spanSep4 = document.createElement('span');
  spanSep4.innerHTML = '&nbsp;&gt;&nbsp;';
  module.exports.internal.breadcrumb.appendChild(spanSep4);

  let spanMatch = document.createElement('span');
  spanMatch.innerHTML = module.exports.internal.matchData.date + ' ' + module.exports.internal.matchData.squads.opponent.name;
  spanMatch.className = 'link';
  spanMatch.onclick = () => {module.exports.internal.stateManager.showState('match-editor', 'match-stats');};
  module.exports.internal.breadcrumb.appendChild(spanMatch);
}

/**
 * attach - Set up any event handlers
 */
function attach() {
  debug('attaching match-editor');
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener);
  ipc.send('get-team-data');
}

/**
 * detach - Clean up any event handlers
 */
function detach() {
  debug('attaching match-editor');
  ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener);
}

module.exports = {
  name: 'match-editor',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    returnTeamDataListener: returnTeamDataListener,
    generateBreadcrumb: generateBreadcrumb,
    findMatch: findMatch,
    stateManager: undefined,
    matchVenue: undefined,
    matchDate: undefined,
    matchTime: undefined,
    matchTeamNamesUs: undefined,
    matchTeamNamesThem: undefined,
    breadcrumb: undefined,
    filename: undefined,
    dataObj: undefined,
    matchData: undefined,
    seasonId: undefined,
    matchId: undefined
  }
};
