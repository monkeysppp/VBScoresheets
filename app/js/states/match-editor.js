
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
  module.exports.internal.matchTeamNamesHome = document.getElementById('input_match-editor_team-heading-home');
  module.exports.internal.matchTeamNamesAway = document.getElementById('input_match-editor_team-heading-away');
  module.exports.internal.squadList = document.getElementById('match-editor_player_list');
  module.exports.internal.squadAddPlayerName = document.getElementById('input_match-editor_add-player');
  module.exports.internal.squadAddPlayerButton = document.getElementById('button_match-editor_add-player');
  module.exports.internal.opponentList = document.getElementById('match-editor_opponent_list');
  module.exports.internal.opponentAddPlayerName = document.getElementById('input_match-editor_add-opponent-name');
  module.exports.internal.opponentAddPlayerNumber = document.getElementById('input_match-editor_add-opponent-number');
  module.exports.internal.opponentAddPlayerButton = document.getElementById('button_match-editor_add-opponent');
  module.exports.internal.setsDiv = document.getElementById('div_match-editor_sets');
  module.exports.internal.breadcrumb = document.getElementById('match-editor_breadcrumbs');
}

/**
 * teamDataSavedListener - React to team data being saved, by storing the match id
 *
 * @private
 */
function teamDataSavedListener() {
  debug('match data saved, resolving state promise');
  module.exports.internal.teamDataSavedPromiseResolver();
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
  module.exports.internal.matchTeamNamesHome.innerHTML = module.exports.internal.dataObj.name;
  module.exports.internal.matchTeamNamesAway.innerHTML = module.exports.internal.matchData.squads.opponent.name;

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

  // Clean up the squad list div
  // while(module.exports.internal.squadList.rows.length > 0) {
  //   module.exports.internal.squadList.deleteRow(0);
  // }

  // populate the squad list
  let trHeading = module.exports.internal.squadList.insertRow(0);
  let thPlaying = trHeading.insertCell(0);
  thPlaying.innerHTML = 'Playing';
  let thName = trHeading.insertCell(1);
  thName.innerHTML = 'PlayerName';
  let thNo = trHeading.insertCell(2);
  thNo.innerHTML = 'Shirt Number';
  let thMVP = trHeading.insertCell(3);
  thMVP.innerHTML = 'MVP';

  dataObj.seasons[seasonId].players.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    }
    return 1;
  }).forEach((player) => {
    let trPlayer = module.exports.internal.squadList.insertRow(module.exports.internal.squadList.rows.length);
    // checkbox
    let tdPlaying = trPlayer.insertCell(0);
    let playerCheckbox = document.createElement('input');
    playerCheckbox.type = 'checkbox';
    tdPlaying.appendChild(playerCheckbox);

    // name
    let tdName = trPlayer.insertCell(1);
    tdName.innerHTML = player.name;

    // number input
    let tdNo = trPlayer.insertCell(2);
    let playerNumber = document.createElement('input');
    playerNumber.type = 'text';
    playerNumber.className = 'match-lineup-input';
    playerNumber.maxLength = 2;
    playerNumber.minLength = 1;
    playerNumber.placeholder = '#';
    playerNumber.size = 2;
    tdNo.appendChild(playerNumber);

    // MVP input
    let tdMVP = trPlayer.insertCell(3);
    let mvp = document.createElement('input');
    mvp.type = 'radio';
    tdMVP.appendChild(mvp);
  });

  if (module.exports.internal.matchData.squads.opponent.players && module.exports.internal.matchData.squads.opponent.players.length > 0) {
    module.exports.internal.matchData.squads.opponent.players.sort((a, b) => {
      if (a.number < b.number) {
        return -1;
      }
      return 1;
    }).forEach((player) => {
      debug('opponent player' + player);
    });
  }

  if (module.exports.internal.matchData.sets && module.exports.internal.matchData.sets.length > 0) {
    debug('sets exist');
  } else {
    appendSet();
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
 * appendSet - description
 *
 * @param  {type} setData   description
 * @param  {type} setNumber description
 * @return {type}           description
 */
function appendSet(/*setData, setNumber*/) {

  let cloneSetsDiv = module.exports.internal.setsDiv.cloneNode(false);
  module.exports.internal.setsDiv.parentNode.replaceChild(cloneSetsDiv, module.exports.internal.setsDiv);
  module.exports.internal.setsDiv = cloneSetsDiv;

  let setDiv;

  // if (setData) {
    // debug('set data exists ' + setNumber);
  // } else {
  setDiv = document.createElement('div');

  let setNameDiv = document.createElement('div');
  setNameDiv.innerHTML = 'Set 1';
  setDiv.appendChild(setNameDiv);

  let setDataDiv = document.createElement('div');
  setDataDiv.className = 'set-box';
  setDiv.appendChild(setDataDiv);

  let setTable = document.createElement('table');
  setTable.className = 'set';
  setDataDiv.appendChild(setTable);

  let teamsRow = setTable.insertRow(0);
  addTeamsRow(teamsRow);

  let serviceOrderRow = setTable.insertRow(1);
  addServiceOrderRow(serviceOrderRow);

  let serviceLineupRow = setTable.insertRow(2);
  addServiceLineupRow(serviceLineupRow);

  let playerPositionRow = setTable.insertRow(3);
  addPlayerPositionRow(playerPositionRow);

  let subsRowOne = setTable.insertRow(4);
  addSubsRowOne(subsRowOne);

  let subsRowTwo = setTable.insertRow(5);
  addSubsRowTwo(subsRowTwo);

  setTable.insertRow(6).insertCell(0).innerHTML = '&nbsp;';
  // }

  module.exports.internal.setsDiv.appendChild(setDiv);
}

function addTeamsRow(teamsRow) {
  let teamANameCell = teamsRow.insertCell(0);
  teamANameCell.innerHTML = module.exports.internal.dataObj.name;
  teamANameCell.colSpan = 5;
  let teamARoleCell = teamsRow.insertCell(1);
  teamARoleCell.innerHTML = 'S/R';
  teamsRow.insertCell(2);
  teamsRow.insertCell(3);
  let teamBNameCell = teamsRow.insertCell(4);
  teamBNameCell.innerHTML = module.exports.internal.matchData.squads.opponent.name;
  teamBNameCell.colSpan = 5;
  let teamBRoleCell = teamsRow.insertCell(5);
  teamBRoleCell.innerHTML = 'S/R';
}

function addServiceOrderRow(serviceOrderRow) {
  let soa1 = serviceOrderRow.insertCell(0);
  soa1.innerHTML = 'I';
  soa1.className = 'box';
  let soa2 = serviceOrderRow.insertCell(1);
  soa2.innerHTML = 'II';
  soa2.className = 'box';
  let soa3 = serviceOrderRow.insertCell(2);
  soa3.innerHTML = 'III';
  soa3.className = 'box';
  let soa4 = serviceOrderRow.insertCell(3);
  soa4.innerHTML = 'IV';
  soa4.className = 'box';
  let soa5 = serviceOrderRow.insertCell(4);
  soa5.innerHTML = 'V';
  soa5.className = 'box';
  let soa6 = serviceOrderRow.insertCell(5);
  soa6.innerHTML = 'VI';
  soa6.className = 'box';

  serviceOrderRow.insertCell(6);
  serviceOrderRow.insertCell(7);

  let sob1 = serviceOrderRow.insertCell(8);
  sob1.innerHTML = 'I';
  sob1.className = 'box';
  let sob2 = serviceOrderRow.insertCell(9);
  sob2.innerHTML = 'II';
  sob2.className = 'box';
  let sob3 = serviceOrderRow.insertCell(10);
  sob3.innerHTML = 'III';
  sob3.className = 'box';
  let sob4 = serviceOrderRow.insertCell(11);
  sob4.innerHTML = 'IV';
  sob4.className = 'box';
  let sob5 = serviceOrderRow.insertCell(12);
  sob5.innerHTML = 'V';
  sob5.className = 'box';
  let sob6 = serviceOrderRow.insertCell(13);
  sob6.innerHTML = 'VI';
  sob6.className = 'box';
}

function addServiceLineupRow(serviceLineupRow) {
  let sla1 = serviceLineupRow.insertCell(0);
  sla1.className = 'box';
  let sla1PlayerNumber = document.createElement('input');
  sla1PlayerNumber.type = 'text';
  sla1PlayerNumber.type = 'text';
  sla1PlayerNumber.className = 'match-lineup-input';
  sla1PlayerNumber.maxLength = 2;
  sla1PlayerNumber.minLength = 1;
  sla1PlayerNumber.placeholder = '#';
  sla1PlayerNumber.size = 2;
  sla1.appendChild(sla1PlayerNumber);
  let sla2 = serviceLineupRow.insertCell(1);
  sla2.className = 'box';
  let sla2PlayerNumber = document.createElement('input');
  sla2PlayerNumber.type = 'text';
  sla2PlayerNumber.type = 'text';
  sla2PlayerNumber.className = 'match-lineup-input';
  sla2PlayerNumber.maxLength = 2;
  sla2PlayerNumber.minLength = 1;
  sla2PlayerNumber.placeholder = '#';
  sla2PlayerNumber.size = 2;
  sla2.appendChild(sla2PlayerNumber);
  let sla3 = serviceLineupRow.insertCell(2);
  sla3.className = 'box';
  let sla3PlayerNumber = document.createElement('input');
  sla3PlayerNumber.type = 'text';
  sla3PlayerNumber.type = 'text';
  sla3PlayerNumber.className = 'match-lineup-input';
  sla3PlayerNumber.maxLength = 2;
  sla3PlayerNumber.minLength = 1;
  sla3PlayerNumber.placeholder = '#';
  sla3PlayerNumber.size = 2;
  sla3.appendChild(sla3PlayerNumber);
  let sla4 = serviceLineupRow.insertCell(3);
  sla4.className = 'box';
  let sla4PlayerNumber = document.createElement('input');
  sla4PlayerNumber.type = 'text';
  sla4PlayerNumber.type = 'text';
  sla4PlayerNumber.className = 'match-lineup-input';
  sla4PlayerNumber.maxLength = 2;
  sla4PlayerNumber.minLength = 1;
  sla4PlayerNumber.placeholder = '#';
  sla4PlayerNumber.size = 2;
  sla4.appendChild(sla4PlayerNumber);
  let sla5 = serviceLineupRow.insertCell(4);
  sla5.className = 'box';
  let sla5PlayerNumber = document.createElement('input');
  sla5PlayerNumber.type = 'text';
  sla5PlayerNumber.type = 'text';
  sla5PlayerNumber.className = 'match-lineup-input';
  sla5PlayerNumber.maxLength = 2;
  sla5PlayerNumber.minLength = 1;
  sla5PlayerNumber.placeholder = '#';
  sla5PlayerNumber.size = 2;
  sla5.appendChild(sla5PlayerNumber);
  let sla6 = serviceLineupRow.insertCell(5);
  sla6.className = 'box';
  let sla6PlayerNumber = document.createElement('input');
  sla6PlayerNumber.type = 'text';
  sla6PlayerNumber.type = 'text';
  sla6PlayerNumber.className = 'match-lineup-input';
  sla6PlayerNumber.maxLength = 2;
  sla6PlayerNumber.minLength = 1;
  sla6PlayerNumber.placeholder = '#';
  sla6PlayerNumber.size = 2;
  sla6.appendChild(sla6PlayerNumber);

  let middleText = serviceLineupRow.insertCell(6);
  middleText.colSpan = 2;
  middleText.innerHTML = 'Line-up';

  let slb1 = serviceLineupRow.insertCell(7);
  slb1.className = 'box';
  let slb1PlayerNumber = document.createElement('input');
  slb1PlayerNumber.type = 'text';
  slb1PlayerNumber.type = 'text';
  slb1PlayerNumber.className = 'match-lineup-input';
  slb1PlayerNumber.maxLength = 2;
  slb1PlayerNumber.minLength = 1;
  slb1PlayerNumber.placeholder = '#';
  slb1PlayerNumber.size = 2;
  slb1.appendChild(slb1PlayerNumber);
  let slb2 = serviceLineupRow.insertCell(8);
  slb2.className = 'box';
  let slb2PlayerNumber = document.createElement('input');
  slb2PlayerNumber.type = 'text';
  slb2PlayerNumber.type = 'text';
  slb2PlayerNumber.className = 'match-lineup-input';
  slb2PlayerNumber.maxLength = 2;
  slb2PlayerNumber.minLength = 1;
  slb2PlayerNumber.placeholder = '#';
  slb2PlayerNumber.size = 2;
  slb2.appendChild(slb2PlayerNumber);
  let slb3 = serviceLineupRow.insertCell(9);
  slb3.className = 'box';
  let slb3PlayerNumber = document.createElement('input');
  slb3PlayerNumber.type = 'text';
  slb3PlayerNumber.type = 'text';
  slb3PlayerNumber.className = 'match-lineup-input';
  slb3PlayerNumber.maxLength = 2;
  slb3PlayerNumber.minLength = 1;
  slb3PlayerNumber.placeholder = '#';
  slb3PlayerNumber.size = 2;
  slb3.appendChild(slb3PlayerNumber);
  let slb4 = serviceLineupRow.insertCell(10);
  slb4.className = 'box';
  let slb4PlayerNumber = document.createElement('input');
  slb4PlayerNumber.type = 'text';
  slb4PlayerNumber.type = 'text';
  slb4PlayerNumber.className = 'match-lineup-input';
  slb4PlayerNumber.maxLength = 2;
  slb4PlayerNumber.minLength = 1;
  slb4PlayerNumber.placeholder = '#';
  slb4PlayerNumber.size = 2;
  slb4.appendChild(slb4PlayerNumber);
  let slb5 = serviceLineupRow.insertCell(11);
  slb5.className = 'box';
  let slb5PlayerNumber = document.createElement('input');
  slb5PlayerNumber.type = 'text';
  slb5PlayerNumber.type = 'text';
  slb5PlayerNumber.className = 'match-lineup-input';
  slb5PlayerNumber.maxLength = 2;
  slb5PlayerNumber.minLength = 1;
  slb5PlayerNumber.placeholder = '#';
  slb5PlayerNumber.size = 2;
  slb5.appendChild(slb5PlayerNumber);
  let slb6 = serviceLineupRow.insertCell(12);
  slb6.className = 'box';
  let slb6PlayerNumber = document.createElement('input');
  slb6PlayerNumber.type = 'text';
  slb6PlayerNumber.type = 'text';
  slb6PlayerNumber.className = 'match-lineup-input';
  slb6PlayerNumber.maxLength = 2;
  slb6PlayerNumber.minLength = 1;
  slb6PlayerNumber.placeholder = '#';
  slb6PlayerNumber.size = 2;
  slb6.appendChild(slb6PlayerNumber);
}

function addPlayerPositionRow(playerPositionRow) {
  let ppa1 = playerPositionRow.insertCell(0);
  let ppa1Position = document.createElement('button');
  ppa1Position.innerHTML = 'M';
  ppa1Position.className = 'button new-item-button';
  ppa1.appendChild(ppa1Position);
  let ppa2 = playerPositionRow.insertCell(1);
  let ppa2Position = document.createElement('button');
  ppa2Position.innerHTML = 'S';
  ppa2Position.className = 'button new-item-button';
  ppa2.appendChild(ppa2Position);
  let ppa3 = playerPositionRow.insertCell(2);
  let ppa3Position = document.createElement('button');
  ppa3Position.innerHTML = '4';
  ppa3Position.className = 'button new-item-button';
  ppa3.appendChild(ppa3Position);
  let ppa4 = playerPositionRow.insertCell(3);
  let ppa4Position = document.createElement('button');
  ppa4Position.innerHTML = 'M';
  ppa4Position.className = 'button new-item-button';
  ppa4.appendChild(ppa4Position);
  let ppa5 = playerPositionRow.insertCell(4);
  let ppa5Position = document.createElement('button');
  ppa5Position.innerHTML = 'O';
  ppa5Position.className = 'button new-item-button';
  ppa5.appendChild(ppa5Position);
  let ppa6 = playerPositionRow.insertCell(5);
  let ppa6Position = document.createElement('button');
  ppa6Position.innerHTML = '4';
  ppa6Position.className = 'button new-item-button';
  ppa6.appendChild(ppa6Position);

  let middleText = playerPositionRow.insertCell(6);
  middleText.colSpan = 2;
  middleText.innerHTML = 'Position';

  let ppb1 = playerPositionRow.insertCell(7);
  ppb1.innerHTML = '&#x25EF;';
  let ppb2 = playerPositionRow.insertCell(8);
  ppb2.innerHTML = '&#x25EF;';
  let ppb3 = playerPositionRow.insertCell(9);
  ppb3.innerHTML = '&#x25EF;';
  let ppb4 = playerPositionRow.insertCell(10);
  ppb4.innerHTML = '&#x25EF;';
  let ppb5 = playerPositionRow.insertCell(11);
  ppb5.innerHTML = '&#x25EF;';
  let ppb6 = playerPositionRow.insertCell(12);
  ppb6.innerHTML = '&#x25EF;';
}

function addSubsRowOne(subFirstRow) {
  let sa1 = subFirstRow.insertCell(0);
  sa1.className = 'box';
  let sa1Sub = document.createElement('button');
  sa1Sub.innerHTML = '+';
  sa1Sub.className = 'button new-item-button';
  sa1.appendChild(sa1Sub);
  let sa2 = subFirstRow.insertCell(1);
  sa2.className = 'box';
  let sa2Sub = document.createElement('button');
  sa2Sub.innerHTML = '+';
  sa2Sub.className = 'button new-item-button';
  sa2.appendChild(sa2Sub);
  let sa3 = subFirstRow.insertCell(2);
  sa3.className = 'box';
  let sa3Sub = document.createElement('button');
  sa3Sub.innerHTML = '+';
  sa3Sub.className = 'button new-item-button';
  sa3.appendChild(sa3Sub);
  let sa4 = subFirstRow.insertCell(3);
  sa4.className = 'box';
  let sa4Sub = document.createElement('button');
  sa4Sub.innerHTML = '+';
  sa4Sub.className = 'button new-item-button';
  sa4.appendChild(sa4Sub);
  let sa5 = subFirstRow.insertCell(4);
  sa5.className = 'box';
  let sa5Sub = document.createElement('button');
  sa5Sub.innerHTML = '+';
  sa5Sub.className = 'button new-item-button';
  sa5.appendChild(sa5Sub);
  let sa6 = subFirstRow.insertCell(5);
  sa6.className = 'box';
  let sa6Sub = document.createElement('button');
  sa6Sub.innerHTML = '+';
  sa6Sub.className = 'button new-item-button';
  sa6.appendChild(sa6Sub);

  let middleText = subFirstRow.insertCell(6);
  middleText.colSpan = 2;
  middleText.innerHTML = 'Subs';

  let sb1 = subFirstRow.insertCell(7);
  sb1.className = 'box';
  sb1.innerHTML = '&#x2295;';
  let sb2 = subFirstRow.insertCell(8);
  sb2.className = 'box';
  sb2.innerHTML = '&#x2295;';
  let sb3 = subFirstRow.insertCell(9);
  sb3.className = 'box';
  sb3.innerHTML = '&#x2295;';
  let sb4 = subFirstRow.insertCell(10);
  sb4.className = 'box';
  sb4.innerHTML = '&#x2295;';
  let sb5 = subFirstRow.insertCell(11);
  sb5.className = 'box';
  sb5.innerHTML = '&#x2295;';
  let sb6 = subFirstRow.insertCell(12);
  sb6.className = 'box';
  sb6.innerHTML = '&#x2295;';
}

function addSubsRowTwo(subSecondRow) {
  let sa1 = subSecondRow.insertCell(0);
  sa1.className = 'box';
  let sa2 = subSecondRow.insertCell(1);
  sa2.className = 'box';
  let sa3 = subSecondRow.insertCell(2);
  sa3.className = 'box';
  let sa4 = subSecondRow.insertCell(3);
  sa4.className = 'box';
  let sa5 = subSecondRow.insertCell(4);
  sa5.className = 'box';
  let sa6 = subSecondRow.insertCell(5);
  sa6.className = 'box';

  subSecondRow.insertCell(6).innerHTML = '&nbsp;';
  subSecondRow.insertCell(7);

  let sb1 = subSecondRow.insertCell(8);
  sb1.className = 'box';
  let sb2 = subSecondRow.insertCell(9);
  sb2.className = 'box';
  let sb3 = subSecondRow.insertCell(10);
  sb3.className = 'box';
  let sb4 = subSecondRow.insertCell(11);
  sb4.className = 'box';
  let sb5 = subSecondRow.insertCell(12);
  sb5.className = 'box';
  let sb6 = subSecondRow.insertCell(13);
  sb6.className = 'box';
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
  ipc.on('team-data-saved', module.exports.internal.teamDataSavedListener);
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener);
  ipc.send('get-team-data');
}

/**
 * detach - Clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach() {
  debug('match-editor detach called');
  return new Promise((resolve) => {
    module.exports.internal.teamDataSavedPromiseResolver = resolve;
    module.exports.internal.saveOnExit();
  })
  .then(() => {
    debug('detaching match-editor');
    ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener);
    ipc.removeListener('team-data-saved', module.exports.internal.teamDataSavedListener);
  });
}

/**
 * This needs to be syncronous - is that evil?  Can we change detach in the state manager to return a promise?
 */
function saveOnExit() {
  debug('saving match data');
  if (module.exports.internal.matchVenue.value.length > 0) {
    module.exports.internal.matchData.venue = module.exports.internal.matchVenue.value;
  }

  ipc.send('save-team-data', module.exports.internal.filename, module.exports.internal.dataObj);
}


module.exports = {
  name: 'match-editor',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamDataSavedListener: teamDataSavedListener,
    returnTeamDataListener: returnTeamDataListener,
    generateBreadcrumb: generateBreadcrumb,
    findMatch: findMatch,
    saveOnExit: saveOnExit,
    teamDataSavedPromiseResolver: undefined,
    stateManager: undefined,
    matchVenue: undefined,
    matchDate: undefined,
    matchTime: undefined,
    matchTeamNamesHome: undefined,
    matchTeamNamesAway: undefined,
    squadList: undefined,
    squadAddPlayerName: undefined,
    squadAddPlayerButton: undefined,
    opponentList: undefined,
    opponentAddPlayerName: undefined,
    opponentAddPlayerNumber: undefined,
    opponentAddPlayerButton: undefined,
    setsDiv: undefined,
    breadcrumb: undefined,
    filename: undefined,
    dataObj: undefined,
    matchData: undefined,
    seasonId: undefined,
    matchId: undefined
  }
};
