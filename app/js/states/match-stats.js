
'use strict'

const electron = require('electron')
const ipc = electron.ipcRenderer

const state = document.querySelector('.match-stats')
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

  module.exports.internal.matchEditButton = document.getElementById('button_match-stats_edit')
  module.exports.internal.breadcrumb = document.getElementById('match-stats_breadcrumbs')

  module.exports.internal.matchEditButton.onclick = () => { module.exports.internal.stateManager.showState('match-stats', 'match-editor') }
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
function returnTeamDataListener (event, filename, dataObj, seasonId, matchId) {
  debug('team data loaded for season ' + seasonId)
  module.exports.internal.filename = filename
  module.exports.internal.dataObj = dataObj
  module.exports.internal.seasonId = seasonId
  module.exports.internal.matchId = matchId
  module.exports.internal.findMatch()

  debug('team data loaded for season called ' + dataObj.seasons[seasonId].name +
    ' and matchId ' + matchId + ' on ' + module.exports.internal.matchData.date + ' against ' +
    module.exports.internal.matchData.squads.opponent.name)

  // generate the breadcrumb
  module.exports.internal.generateBreadcrumb()

  // Clean up the list div
  // let cloneMatchList = module.exports.internal.matchList.cloneNode(false)
  // module.exports.internal.matchList.parentNode.replaceChild(cloneMatchList, module.exports.internal.matchList)
  // module.exports.internal.matchList = cloneMatchList
  //
  // if (dataObj.seasons[seasonId].matches) {
  //   debug('processing ' + dataObj.seasons[seasonId].matches.length + ' matches')
  //   dataObj.seasons[seasonId].matches.sort((a, b) => {
  //     if (a.date < b.date) {
  //       return -1
  //     }
  //
  //     return 1
  //   }).forEach((match) => {
  //     let span = document.createElement('span')
  //     span.innerHTML = match.date + ' ' + match.squads.opponent.name
  //     span.className = 'list-item'
  //     span.onclick = () => {ipc.send('store-team-match', match.id);}
  //     module.exports.internal.matchList.appendChild(span)
  //     debug('adding match ' + match.date + ' ' + match.squads.opponent.name + ' to match list ui')
  //   })
  // }
}

function findMatch () {
  module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].matches.forEach((match) => {
    if (match.id === module.exports.internal.matchId) {
      module.exports.internal.matchData = match
    }
  })
}

/**
 * generateBreadcrumb - Generate the breadcrumb for this page:
 *  Home > $TeamName > $SeasonName > $MatchDate $matchOpponent
 *
 * Home links back to pick a team.
 * $TeamName links back to pick a season
 * $SeasonName links back to main branch
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
  spanHome.onclick = () => { module.exports.internal.stateManager.showState('match-stats', 'pick-a-team') }
  module.exports.internal.breadcrumb.appendChild(spanHome)

  let spanSep1 = document.createElement('span')
  spanSep1.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep1)

  let spanTeam = document.createElement('span')
  spanTeam.innerHTML = module.exports.internal.dataObj.name
  spanTeam.className = 'link'
  spanTeam.onclick = () => { module.exports.internal.stateManager.showState('match-stats', 'pick-a-season') }
  module.exports.internal.breadcrumb.appendChild(spanTeam)

  let spanSep2 = document.createElement('span')
  spanSep2.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep2)

  let spanSeason = document.createElement('span')
  spanSeason.innerHTML = module.exports.internal.dataObj.seasons[module.exports.internal.seasonId].name
  spanSeason.className = 'link'
  spanSeason.onclick = () => { module.exports.internal.stateManager.showState('match-stats', 'main-branch') }
  module.exports.internal.breadcrumb.appendChild(spanSeason)

  let spanSep3 = document.createElement('span')
  spanSep3.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep3)

  let spanMatches = document.createElement('span')
  spanMatches.innerHTML = 'Matches'
  spanMatches.className = 'link'
  spanMatches.onclick = () => { module.exports.internal.stateManager.showState('match-stats', 'pick-a-match') }
  module.exports.internal.breadcrumb.appendChild(spanMatches)

  let spanSep4 = document.createElement('span')
  spanSep4.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep4)

  let spanMatch = document.createElement('span')
  spanMatch.innerHTML = module.exports.internal.matchData.date + ' ' + module.exports.internal.matchData.squads.opponent.name
  module.exports.internal.breadcrumb.appendChild(spanMatch)
}

/**
 * attach - Set up any event handlers
 */
function attach () {
  debug('attaching match-stats')
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener)
  ipc.send('get-team-data')
}

/**
 * detach - Clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach () {
  debug('detaching match-stats')
  ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener)
  return Promise.resolve()
}

module.exports = {
  name: 'match-stats',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    returnTeamDataListener: returnTeamDataListener,
    generateBreadcrumb: generateBreadcrumb,
    findMatch: findMatch,
    stateManager: undefined,
    matchEditButton: undefined,
    breadcrumb: undefined,
    filename: undefined,
    dataObj: undefined,
    matchData: undefined,
    seasonId: undefined,
    matchId: undefined
  }
}
