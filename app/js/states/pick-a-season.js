
'use strict'

const electron = require('electron')
const ipc = electron.ipcRenderer

const state = document.querySelector('.pick-a-season')
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

  module.exports.internal.seasonAddButton = document.getElementById('button_pick-a-season_add')
  module.exports.internal.seasonName = document.getElementById('input_pick-a-season')
  module.exports.internal.seasonList = document.getElementById('pick-a-season_list')
  module.exports.internal.breadcrumb = document.getElementById('pick-a-season_breadcrumbs')

  module.exports.internal.seasonAddButton.onclick = module.exports.internal.seasonAddOnClick
  module.exports.internal.seasonName.oninput = module.exports.internal.seasonNameOnInput
}

/**
 * returnTeamDataListener - Handle when a specific team's data is loaded.  This effectively sets the view of
 * this page.
 *
 * @param  {object} event       IPC Event
 * @param  {string} filename    the filename that was loaded
 * @param  {object} dataObj     the team data object that was loaded
 *
 * @private
 */
function returnTeamDataListener (event, filename, dataObj) {
  debug('team data loaded')
  module.exports.internal.dataObj = dataObj
  module.exports.internal.filename = filename

  // Clean up the input text box
  module.exports.internal.seasonName.value = ''
  seasonNameOnInput()

  // generate the breadcrumb
  module.exports.internal.generateBreadcrumb()

  // clean up any pre-existing content
  let cloneSeasonList = module.exports.internal.seasonList.cloneNode(false)
  module.exports.internal.seasonList.parentNode.replaceChild(cloneSeasonList, module.exports.internal.seasonList)
  module.exports.internal.seasonList = cloneSeasonList

  dataObj.seasons.forEach((elem, index) => {
    let span = document.createElement('span')
    span.innerHTML = elem.name
    span.className = 'list-item'
    span.onclick = () => { ipc.send('store-team-season', index) }
    module.exports.internal.seasonList.appendChild(span)
  })
}

/**
 * teamDataSavedListener - Listener for when a new season is saved and stores
 * a season selector for that season.
 *
 * @private
 */
function teamDataSavedListener () {
  ipc.send('store-team-season', module.exports.internal.dataObj.seasons.length - 1)
}

/**
 * teamSeasonStoredListener - Reacts to the season selector being stored, then chooses the next
 * page to load:
 *  - if the season has fewer than 6 players then show add-first-squad else...
 *  - if the season has no matches then show add-first-match else...
 *  - show main-branch
 *
 * @param  {object} event       IPC Event
 * @param  {number} seasonId    the seasson id that was stored
 *
 * @private
 */
function teamSeasonStoredListener (event, seasonId) {
  if (!module.exports.internal.dataObj.seasons[seasonId].players || module.exports.internal.dataObj.seasons[seasonId].players.length < 6) {
    module.exports.internal.stateManager.showState('pick-a-season', 'add-first-squad')
  } else if (!module.exports.internal.dataObj.seasons[seasonId].matches) {
    module.exports.internal.stateManager.showState('pick-a-season', 'add-first-match')
  } else {
    module.exports.internal.stateManager.showState('pick-a-season', 'main-branch')
  }
}

/**
 * seasonAddOnClick - A click handler for when the "add season" button is clicked.  This only
 * acts if the season name text value contains more than 0 characters
 *
 * @private
 */
function seasonAddOnClick () {
  if (module.exports.internal.seasonName.value.length > 0) {
    module.exports.internal.dataObj.seasons.push({name: module.exports.internal.seasonName.value})
    ipc.send('save-team-data', module.exports.internal.filename, module.exports.internal.dataObj)
  }
}

/**
 * seasonNameOnInput - An on-input handler for the season name text field.  This greys out the
 * "add" button when there is no text in the season name.
 *
 * @private
 */
function seasonNameOnInput () {
  if (module.exports.internal.seasonName.value.length === 0) {
    module.exports.internal.seasonAddButton.className = 'button new-item-button-disabled'
  } else {
    module.exports.internal.seasonAddButton.className = 'button new-item-button'
  }
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
  spanHome.onclick = () => { module.exports.internal.stateManager.showState('pick-a-season', 'pick-a-team') }
  module.exports.internal.breadcrumb.appendChild(spanHome)

  let spanSep1 = document.createElement('span')
  spanSep1.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep1)

  let spanTeam = document.createElement('span')
  spanTeam.innerHTML = module.exports.internal.dataObj.name
  module.exports.internal.breadcrumb.appendChild(spanTeam)
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
 */
function attach () {
  debug('attaching pick-a-season')
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener)
  ipc.on('team-data-saved', module.exports.internal.teamDataSavedListener)
  ipc.on('team-season-stored', module.exports.internal.teamSeasonStoredListener)
  ipc.send('get-team-data')
}

/**
 * detach - attach the state code from the displayed ui and clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach () {
  debug('detaching pick-a-season')
  ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener)
  ipc.removeListener('team-data-saved', module.exports.internal.teamDataSavedListener)
  ipc.removeListener('team-season-stored', module.exports.internal.teamSeasonStoredListener)
  return Promise.resolve()
}

module.exports = {
  name: 'pick-a-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    returnTeamDataListener: returnTeamDataListener,
    teamDataSavedListener: teamDataSavedListener,
    teamSeasonStoredListener: teamSeasonStoredListener,
    seasonAddOnClick: seasonAddOnClick,
    seasonNameOnInput: seasonNameOnInput,
    generateBreadcrumb: generateBreadcrumb,
    stateManager: undefined,
    seasonAddButton: undefined,
    seasonName: undefined,
    seasonList: undefined,
    breadcrumb: undefined,
    filename: undefined,
    dataObj: undefined
  }
}
