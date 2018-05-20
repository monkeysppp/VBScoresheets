
'use strict'

const electron = require('electron')
const ipc = electron.ipcRenderer

const state = document.querySelector('.main-branch')
const debug = require('../debug.js')

/**
 * init - Initialize the page handler, ataching the state manager and discovering any interactive elements
 *
 * @param  {object} stateManager the state-manager for this state to send instructions to
 */
function init (stateManager) {
  if (!stateManager) {
    throw new Error('no state-manager given')
  }

  module.exports.internal.stateManager = stateManager

  module.exports.internal.players = document.getElementById('main-branch_players')
  module.exports.internal.matches = document.getElementById('main-branch_matches')
  module.exports.internal.seasons = document.getElementById('main-branch_season')
  module.exports.internal.breadcrumb = document.getElementById('main-branch_breadcrumbs')

  module.exports.internal.players.onclick = module.exports.internal.playersOnClick
  module.exports.internal.matches.onclick = module.exports.internal.matchesOnClick
  module.exports.internal.seasons.onclick = module.exports.internal.seasonsOnClick
}

/**
 * playersOnClick - Show the state 'pick-a-player'
 *
 * @private
 */
function playersOnClick () {
  module.exports.internal.stateManager.showState('main-branch', 'pick-a-player')
}

/**
 * matchesOnClick - Show the state 'pick-a-match'
 *
 * @private
 */
function matchesOnClick () {
  module.exports.internal.stateManager.showState('main-branch', 'pick-a-match')
}

/**
 * seasonsOnClick - Show the state 'season-stats'
 *
 * @private
 */
function seasonsOnClick () {
  module.exports.internal.stateManager.showState('main-branch', 'season-stats')
}

/**
 * returnTeamDataListener - React to a request to get the known team data.  Populate the player list.
 * If the number of players is 6 or more then enable the done button.
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename the filename that was loaded
 * @param  {object} dataObj  the team data
 * @param  {number} seasonId the currently selected season
 *
 * @private
 */
function returnTeamDataListener (event, filename, dataObj, seasonId) {
  debug('team data loaded')
  module.exports.internal.dataObj = dataObj
  module.exports.internal.seasonId = seasonId

  // generate the breadcrumb
  module.exports.internal.generateBreadcrumb()
}

/**
 * generateBreadcrumb - Generate the breadcrumb for this page:
 *  Home > $TeamName
 *
 * Home links back to pick a team.
 *
 * @private
 */
function generateBreadcrumb () {
  let cloneBreadcrumb = module.exports.internal.breadcrumb.cloneNode(false)
  module.exports.internal.breadcrumb.parentNode.replaceChild(cloneBreadcrumb, module.exports.internal.breadcrumb)
  module.exports.internal.breadcrumb = cloneBreadcrumb

  let spanHome = document.createElement('span')
  spanHome.innerHTML = 'Home'
  spanHome.className = 'link'
  spanHome.onclick = () => { module.exports.internal.stateManager.showState('main-branch', 'pick-a-team') }
  module.exports.internal.breadcrumb.appendChild(spanHome)

  let spanSep1 = document.createElement('span')
  spanSep1.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep1)

  let spanTeam = document.createElement('span')
  spanTeam.innerHTML = module.exports.internal.dataObj.name
  spanTeam.className = 'link'
  spanTeam.onclick = () => { module.exports.internal.stateManager.showState('main-branch', 'pick-a-season') }
  module.exports.internal.breadcrumb.appendChild(spanTeam)

  let spanSep2 = document.createElement('span')
  spanSep2.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep2)

  let spanSeason = document.createElement('span')
  spanSeason.innerHTML = module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].name
  module.exports.internal.breadcrumb.appendChild(spanSeason)
}

/**
 * attach - Set up any event handlers
 */
function attach () {
  debug('attaching main-branch')
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener)
  ipc.send('get-team-data')
}

/**
 * detach - Clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach () {
  debug('detaching main-branch')
  ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener)
  return Promise.resolve()
}

module.exports = {
  name: 'main-branch',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    returnTeamDataListener: returnTeamDataListener,
    playersOnClick: playersOnClick,
    matchesOnClick: matchesOnClick,
    seasonsOnClick: seasonsOnClick,
    generateBreadcrumb: generateBreadcrumb,
    stateManager: undefined,
    players: undefined,
    teams: undefined,
    seasons: undefined,
    breadcrumb: undefined,
    dataObj: undefined,
    seasonId: undefined
  }
}
