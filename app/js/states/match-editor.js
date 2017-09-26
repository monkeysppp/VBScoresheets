
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
  module.exports.internal.matchButtonHome = document.getElementById('button_match-editor_home');
  module.exports.internal.matchButtonAway = document.getElementById('button_match-editor_away');
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

  module.exports.internal.matchButtonHome.onclick = module.exports.internal.homeMatchOnClick;
  module.exports.internal.matchButtonAway.onclick = module.exports.internal.awayMatchOnClick;
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

  if (module.exports.internal.matchData.home_or_away === 'home') {
    module.exports.internal.homeMatchOnClick();
  } else {
    module.exports.internal.awayMatchOnClick();
  }

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
  let cloneSquadListDiv = module.exports.internal.squadList.cloneNode(false);
  module.exports.internal.squadList.parentNode.replaceChild(cloneSquadListDiv, module.exports.internal.squadList);
  module.exports.internal.squadList = cloneSquadListDiv;

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
    playerCheckbox.className = 'checkbox';
    playerCheckbox.name = 'playing-us';
    playerCheckbox.id = player.id;
    if (module.exports.internal.matchData.squads.us && module.exports.internal.matchData.squads.us.find((squadPlayer) => {return parseInt(squadPlayer.id) === player.id;})) {
      playerCheckbox.checked = true;
    }
    tdPlaying.appendChild(playerCheckbox);

    // name
    let tdName = trPlayer.insertCell(1);
    tdName.innerHTML = player.name;

    // number input
    let tdNo = trPlayer.insertCell(2);
    let playerNumber = document.createElement('input');
    playerNumber.type = 'text';
    playerNumber.className = 'match-lineup-input';
    playerNumber.name = 'match-lineup-us-' + player.id;
    playerNumber.id = 'match-lineup-us-' + player.id;
    if (module.exports.internal.matchData.squads.us) {
      module.exports.internal.matchData.squads.us.forEach((squadPlayer) => {
        if (parseInt(squadPlayer.id) === player.id && squadPlayer.number) {
          playerNumber.value = squadPlayer.number;
        }
      });
    }
    playerNumber.maxLength = 2;
    playerNumber.minLength = 1;
    playerNumber.placeholder = '#';
    playerNumber.size = 2;
    tdNo.appendChild(playerNumber);

    // MVP input
    let tdMVP = trPlayer.insertCell(3);
    let mvp = document.createElement('input');
    mvp.type = 'radio';
    mvp.className = 'radio';
    mvp.name = 'mvp';
    mvp.value = player.id;
    mvp.id = 'mvp-us-' + player.id;
    if (player.id === module.exports.internal.matchData.mvp) {
      mvp.checked = true;
    }
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

  let cloneSetsDiv = module.exports.internal.setsDiv.cloneNode(false);
  module.exports.internal.setsDiv.parentNode.replaceChild(cloneSetsDiv, module.exports.internal.setsDiv);
  module.exports.internal.setsDiv = cloneSetsDiv;

  if (module.exports.internal.matchData.sets && module.exports.internal.matchData.sets.length > 0) {
    debug('sets exist');
  } else {
    appendSet(undefined, 1);
    appendSet(undefined, 2);
    appendSet(undefined, 3);
    appendSet(undefined, 4);
    appendSet(undefined, 5);
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
function appendSet(setData, setNumber) {
  let setDiv;

  // if (setData) {
    // debug('set data exists ' + setNumber);
  // } else {
  setDiv = document.createElement('div');

  let setNameDiv = document.createElement('div');
  setNameDiv.innerHTML = 'Set ' + setNumber;
  setDiv.appendChild(setNameDiv);

  let setDataDiv = document.createElement('div');
  setDataDiv.className = 'set-box';
  setDiv.appendChild(setDataDiv);

  let setTable = document.createElement('table');
  setTable.className = 'set';
  setDataDiv.appendChild(setTable);

  let rowCounter = 0;

  let teamsRow = setTable.insertRow(rowCounter++);
  addTeamsRow(teamsRow, setNumber);

  let serviceOrderRow = setTable.insertRow(rowCounter++);
  addServiceOrderRow(serviceOrderRow);

  let serviceLineupRow = setTable.insertRow(rowCounter++);
  addServiceLineupRow(serviceLineupRow);

  let playerPositionRow = setTable.insertRow(rowCounter++);
  addPlayerPositionRow(playerPositionRow);

  let subsRowOne = setTable.insertRow(rowCounter++);
  addSubsRowOne(subsRowOne);

  let subsRowTwo = setTable.insertRow(rowCounter++);
  addSubsRowTwo(subsRowTwo);

  let subsRowThree = setTable.insertRow(rowCounter++);
  addSubsRowThree(subsRowThree);

  setTable.insertRow(rowCounter++).insertCell(0).innerHTML = '&nbsp;';

  let pointsRowOne = setTable.insertRow(rowCounter++);
  addPointsRow(pointsRowOne, 1);
  let pointsRowTwo = setTable.insertRow(rowCounter++);
  addPointsRow(pointsRowTwo, 2);
  let pointsRowThree = setTable.insertRow(rowCounter++);
  addPointsRow(pointsRowThree, 3);
  let pointsRowFour = setTable.insertRow(rowCounter++);
  addPointsRow(pointsRowFour, 4);
  let pointsRowFive = setTable.insertRow(rowCounter++);
  addPointsRow(pointsRowFive, 5);

  setTable.insertRow(rowCounter++).insertCell(0).innerHTML = '&nbsp;';

  let timeoutRowOne = setTable.insertRow(rowCounter++);
  addTimeoutRow(timeoutRowOne, 1);
  let timeoutRowTwo = setTable.insertRow(rowCounter++);
  addTimeoutRow(timeoutRowTwo, 2);
  // }

  module.exports.internal.setsDiv.appendChild(setDiv);

  let setSpacer = document.createElement('div');
  setSpacer.innerHTML = '&nbsp;<br>&nbsp;';
  module.exports.internal.setsDiv.appendChild(setSpacer);
}

function addTeamsRow(teamsRow, setNumber) {
  let teamANameCell = teamsRow.insertCell(0);
  if (setNumber === 1 || setNumber === 3) {
    teamANameCell.innerHTML = module.exports.internal.dataObj.name;
  } else if (setNumber === 2 || setNumber === 4) {
    teamANameCell.innerHTML = module.exports.internal.matchData.squads.opponent.name;
  }
  teamANameCell.colSpan = 5;

  let teamARoleCell = teamsRow.insertCell(1);
  if (setNumber === 1) {
    let teamAServeButton = document.createElement('button');
    teamAServeButton.className = 'button radio-button-on group-top serve-receive-toggle';
    teamAServeButton.innerHTML = 'S';
    teamARoleCell.appendChild(teamAServeButton);
    let teamAReceiveButton = document.createElement('button');
    teamAReceiveButton.className = 'button radio-button-off group-bottom serve-receive-toggle';
    teamAReceiveButton.innerHTML = 'R';
    teamARoleCell.appendChild(teamAReceiveButton);
  } else {
    teamARoleCell.innerHTML = 'R';
  }

  teamsRow.insertCell(2);
  teamsRow.insertCell(3);

  let teamBNameCell = teamsRow.insertCell(4);
  if (setNumber === 1 || setNumber === 3) {
    teamBNameCell.innerHTML = module.exports.internal.matchData.squads.opponent.name;
  } else if (setNumber === 2 || setNumber === 4) {
    teamBNameCell.innerHTML = module.exports.internal.dataObj.name;
  }
  teamBNameCell.colSpan = 5;

  if (setNumber === 1) {
    let teamBRoleCell = teamsRow.insertCell(5);
    let teamBServeButton = document.createElement('button');
    teamBServeButton.className = 'button radio-button-off group-top serve-receive-toggle';
    teamBServeButton.innerHTML = 'S';
    teamBRoleCell.appendChild(teamBServeButton);
    let teamBReceiveButton = document.createElement('button');
    teamBReceiveButton.className = 'button radio-button-on group-bottom serve-receive-toggle';
    teamBReceiveButton.innerHTML = 'R';
    teamBRoleCell.appendChild(teamBReceiveButton);
  } else {
    teamARoleCell.innerHTML = 'S';
  }
}

// function swapServers() {
//   // ???
// }

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
  sla1PlayerNumber.id = 'sla1';
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
  sla2PlayerNumber.id = 'sla2';
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
  sla3PlayerNumber.id = 'sla3';
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
  sla4PlayerNumber.id = 'sla4';
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
  sla5PlayerNumber.id = 'sla5';
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
  sla6PlayerNumber.id = 'sla6';
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
  slb1PlayerNumber.id = 'slb1';
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
  slb2PlayerNumber.id = 'slb2';
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
  slb3PlayerNumber.id = 'slb3';
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
  slb4PlayerNumber.id = 'slb4';
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
  slb5PlayerNumber.id = 'slb5';
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
  slb6PlayerNumber.id = 'slb6';
  slb6.appendChild(slb6PlayerNumber);
}

function addPlayerPositionRow(playerPositionRow) {
  let ppa1 = playerPositionRow.insertCell(0);
  let ppa1Position = document.createElement('button');
  ppa1Position.innerHTML = 'M';
  ppa1Position.className = 'button cycle-button';
  ppa1.appendChild(ppa1Position);
  let ppa2 = playerPositionRow.insertCell(1);
  let ppa2Position = document.createElement('button');
  ppa2Position.innerHTML = 'S';
  ppa2Position.className = 'button cycle-button';
  ppa2.appendChild(ppa2Position);
  let ppa3 = playerPositionRow.insertCell(2);
  let ppa3Position = document.createElement('button');
  ppa3Position.innerHTML = '4';
  ppa3Position.className = 'button cycle-button';
  ppa3.appendChild(ppa3Position);
  let ppa4 = playerPositionRow.insertCell(3);
  let ppa4Position = document.createElement('button');
  ppa4Position.innerHTML = 'M';
  ppa4Position.className = 'button cycle-button';
  ppa4.appendChild(ppa4Position);
  let ppa5 = playerPositionRow.insertCell(4);
  let ppa5Position = document.createElement('button');
  ppa5Position.innerHTML = 'O';
  ppa5Position.className = 'button cycle-button';
  ppa5.appendChild(ppa5Position);
  let ppa6 = playerPositionRow.insertCell(5);
  let ppa6Position = document.createElement('button');
  ppa6Position.innerHTML = '4';
  ppa6Position.className = 'button cycle-button';
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

function addSubsRowThree(subThirdRow) {
  let sa1 = subThirdRow.insertCell(0);
  sa1.className = 'box';
  let sa2 = subThirdRow.insertCell(1);
  sa2.className = 'box';
  let sa3 = subThirdRow.insertCell(2);
  sa3.className = 'box';
  let sa4 = subThirdRow.insertCell(3);
  sa4.className = 'box';
  let sa5 = subThirdRow.insertCell(4);
  sa5.className = 'box';
  let sa6 = subThirdRow.insertCell(5);
  sa6.className = 'box';

  subThirdRow.insertCell(6).innerHTML = '&nbsp;';
  subThirdRow.insertCell(7);

  let sb1 = subThirdRow.insertCell(8);
  sb1.className = 'box';
  let sb2 = subThirdRow.insertCell(9);
  sb2.className = 'box';
  let sb3 = subThirdRow.insertCell(10);
  sb3.className = 'box';
  let sb4 = subThirdRow.insertCell(11);
  sb4.className = 'box';
  let sb5 = subThirdRow.insertCell(12);
  sb5.className = 'box';
  let sb6 = subThirdRow.insertCell(13);
  sb6.className = 'box';
}

function addPointsRow(pointsRow, rowNumber) {
  let cellCount = 0;

  let pra1 = pointsRow.insertCell(cellCount++);
  pra1.className = 'box';
  let pra1Score = document.createElement('input');
  pra1Score.type = 'text';
  pra1Score.type = 'text';
  pra1Score.className = 'match-lineup-input';
  pra1Score.maxLength = 2;
  pra1Score.minLength = 1;
  pra1Score.placeholder = '#';
  pra1Score.size = 2;
  pra1.appendChild(pra1Score);
  let pra2 = pointsRow.insertCell(cellCount++);
  pra2.className = 'box';
  let pra2Score = document.createElement('input');
  pra2Score.type = 'text';
  pra2Score.type = 'text';
  pra2Score.className = 'match-lineup-input';
  pra2Score.maxLength = 2;
  pra2Score.minLength = 1;
  pra2Score.placeholder = '#';
  pra2Score.size = 2;
  pra2.appendChild(pra2Score);
  let pra3 = pointsRow.insertCell(cellCount++);
  pra3.className = 'box';
  let pra3Score = document.createElement('input');
  pra3Score.type = 'text';
  pra3Score.type = 'text';
  pra3Score.className = 'match-lineup-input';
  pra3Score.maxLength = 2;
  pra3Score.minLength = 1;
  pra3Score.placeholder = '#';
  pra3Score.size = 2;
  pra3.appendChild(pra3Score);
  let pra4 = pointsRow.insertCell(cellCount++);
  pra4.className = 'box';
  let pra4Score = document.createElement('input');
  pra4Score.type = 'text';
  pra4Score.type = 'text';
  pra4Score.className = 'match-lineup-input';
  pra4Score.maxLength = 2;
  pra4Score.minLength = 1;
  pra4Score.placeholder = '#';
  pra4Score.size = 2;
  pra4.appendChild(pra4Score);
  let pra5 = pointsRow.insertCell(cellCount++);
  pra5.className = 'box';
  let pra5Score = document.createElement('input');
  pra5Score.type = 'text';
  pra5Score.type = 'text';
  pra5Score.className = 'match-lineup-input';
  pra5Score.maxLength = 2;
  pra5Score.minLength = 1;
  pra5Score.placeholder = '#';
  pra5Score.size = 2;
  pra5.appendChild(pra5Score);
  let pra6 = pointsRow.insertCell(cellCount++);
  pra6.className = 'box';
  let pra6Score = document.createElement('input');
  pra6Score.type = 'text';
  pra6Score.type = 'text';
  pra6Score.className = 'match-lineup-input';
  pra6Score.maxLength = 2;
  pra6Score.minLength = 1;
  pra6Score.placeholder = '#';
  pra6Score.size = 2;
  pra6.appendChild(pra6Score);

  if (rowNumber === 1) {
    let middleText = pointsRow.insertCell(cellCount++);
    middleText.colSpan = 2;
    middleText.rowSpan = 2;
    middleText.innerHTML = 'Service Rounds';
  } else if (rowNumber > 2) {
    let middleText = pointsRow.insertCell(cellCount++);
    middleText.colSpan = 2;
  }

  let prb1 = pointsRow.insertCell(cellCount++);
  prb1.className = 'box';
  let prb1Score = document.createElement('input');
  prb1Score.type = 'text';
  prb1Score.type = 'text';
  prb1Score.className = 'match-lineup-input';
  prb1Score.maxLength = 2;
  prb1Score.minLength = 1;
  prb1Score.placeholder = '#';
  prb1Score.size = 2;
  prb1.appendChild(prb1Score);
  let prb2 = pointsRow.insertCell(cellCount++);
  prb2.className = 'box';
  let prb2Score = document.createElement('input');
  prb2Score.type = 'text';
  prb2Score.type = 'text';
  prb2Score.className = 'match-lineup-input';
  prb2Score.maxLength = 2;
  prb2Score.minLength = 1;
  prb2Score.placeholder = '#';
  prb2Score.size = 2;
  prb2.appendChild(prb2Score);
  let prb3 = pointsRow.insertCell(cellCount++);
  prb3.className = 'box';
  let prb3Score = document.createElement('input');
  prb3Score.type = 'text';
  prb3Score.type = 'text';
  prb3Score.className = 'match-lineup-input';
  prb3Score.maxLength = 2;
  prb3Score.minLength = 1;
  prb3Score.placeholder = '#';
  prb3Score.size = 2;
  prb3.appendChild(prb3Score);
  let prb4 = pointsRow.insertCell(cellCount++);
  prb4.className = 'box';
  let prb4Score = document.createElement('input');
  prb4Score.type = 'text';
  prb4Score.type = 'text';
  prb4Score.className = 'match-lineup-input';
  prb4Score.maxLength = 2;
  prb4Score.minLength = 1;
  prb4Score.placeholder = '#';
  prb4Score.size = 2;
  prb4.appendChild(prb4Score);
  let prb5 = pointsRow.insertCell(cellCount++);
  prb5.className = 'box';
  let prb5Score = document.createElement('input');
  prb5Score.type = 'text';
  prb5Score.type = 'text';
  prb5Score.className = 'match-lineup-input';
  prb5Score.maxLength = 2;
  prb5Score.minLength = 1;
  prb5Score.placeholder = '#';
  prb5Score.size = 2;
  prb5.appendChild(prb5Score);
  let prb6 = pointsRow.insertCell(cellCount++);
  prb6.className = 'box';
  let prb6Score = document.createElement('input');
  prb6Score.type = 'text';
  prb6Score.type = 'text';
  prb6Score.className = 'match-lineup-input';
  prb6Score.maxLength = 2;
  prb6Score.minLength = 1;
  prb6Score.placeholder = '#';
  prb6Score.size = 2;
  prb6.appendChild(prb6Score);
}

function addTimeoutRow(timeoutRow, rowNumber) {
  let leftSpace = timeoutRow.insertCell(0);
  leftSpace.colSpan = 5;

  let toa = timeoutRow.insertCell(1);
  toa.className = 'box';
  if (rowNumber == 1) {
    let toaTO = document.createElement('button');
    toaTO.innerHTML = '+';
    toaTO.className = 'button new-item-button';
    toa.appendChild(toaTO);
  } else {
    toa.innerHTML = '&nbsp;';
  }

  let middleText = timeoutRow.insertCell(2);
  middleText.colSpan = 2;
  if (rowNumber == 1) {
    middleText.innerHTML = '"T"';
  }

  let tob = timeoutRow.insertCell(3);
  tob.className = 'box';
  if (rowNumber == 1) {
    let tobTO = document.createElement('button');
    tobTO.innerHTML = '+';
    tobTO.className = 'button new-item-button';
    tob.appendChild(tobTO);
  } else {
    tob.innerHTML = '&nbsp;';
  }
}

/**
 * homeMatchOnClick - A click handler for when the "home" match button is clicked.
 *
 * @private
 */
function homeMatchOnClick() {
  module.exports.internal.matchButtonHome.className = 'button radio-button-on group-left';
  module.exports.internal.matchButtonAway.className = 'button radio-button-off group-right';
  module.exports.internal.matchData.home_or_away = 'home';

  module.exports.internal.matchTeamNamesHome.innerHTML = module.exports.internal.dataObj.name;
  module.exports.internal.matchTeamNamesAway.innerHTML = module.exports.internal.matchData.squads.opponent.name;
}

/**
 * awayMatchOnClick - A click handler for when the "home" match button is clicked.
 *
 * @private
 */
function awayMatchOnClick() {
  module.exports.internal.matchButtonAway.className = 'button radio-button-on group-right';
  module.exports.internal.matchButtonHome.className = 'button radio-button-off group-left';
  module.exports.internal.matchData.home_or_away = 'away';

  module.exports.internal.matchTeamNamesHome.innerHTML = module.exports.internal.matchData.squads.opponent.name;
  module.exports.internal.matchTeamNamesAway.innerHTML = module.exports.internal.dataObj.name;
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

  if (module.exports.internal.matchTime.value) {
    module.exports.internal.matchData.time = module.exports.internal.matchTime.value;
  }

  if (document.querySelector('input[name="mvp"]:checked')) {
    module.exports.internal.matchData.mvp = parseInt(document.querySelector('input[name="mvp"]:checked').value);
  }

  if (document.querySelector('input[name="playing-us"]:checked')) {
    module.exports.internal.matchData.squads.us = [];
    document.querySelectorAll('input[name="playing-us"]:checked').forEach((squadPlayer) => {
      let playerEntry = {};
      playerEntry.id = parseInt(squadPlayer.id);
      playerEntry.number = parseInt(document.getElementById('match-lineup-us-' + squadPlayer.id).value);
      module.exports.internal.matchData.squads.us.push(playerEntry);
    });
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
    homeMatchOnClick: homeMatchOnClick,
    awayMatchOnClick: awayMatchOnClick,
    generateBreadcrumb: generateBreadcrumb,
    findMatch: findMatch,
    saveOnExit: saveOnExit,
    teamDataSavedPromiseResolver: undefined,
    stateManager: undefined,
    matchVenue: undefined,
    matchDate: undefined,
    matchTime: undefined,
    matchButtonHome: undefined,
    matchButtonAway: undefined,
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
