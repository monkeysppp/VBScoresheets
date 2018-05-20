
'use strict'

const electron = require('electron')
const ipc = electron.ipcRenderer

const state = document.querySelector('.add-first-season')
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

  module.exports.internal.seasonAddButton = document.getElementById('button_add-first-season_add')
  module.exports.internal.seasonName = document.getElementById('input_add-first-season')
  module.exports.internal.breadcrumb = document.getElementById('add-first-season_breadcrumbs')

  module.exports.internal.seasonAddButton.onclick = module.exports.internal.seasonAddOnClick
  module.exports.internal.seasonName.oninput = module.exports.internal.seasonNameOnInput
}

/**
 * teamDataSavedListener - React to team data being saved, by storing the season id
 *
 * @private
 */
function teamDataSavedListener () {
  debug('team data saved, storing season selector')
  ipc.send('store-team-season', 0)
}

/**
 * teamSeasonStoreListener - React to season selector being stored, by switching state to 'add-first-squad'
 *
 * @private
 */
function teamSeasonStoreListener () {
  debug('team season selector stored, loading add-first-squad')
  module.exports.internal.stateManager.showState('add-first-season', 'add-first-squad')
}

/**
 * returnTeamDataListener - React to a request to get the known team data
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename the filename that was loaded
 * @param  {object} dataObj  the team data
 *
 * @private
 */
function returnTeamDataListener (event, filename, dataObj) {
  debug('team data loaded')
  module.exports.internal.filename = filename
  module.exports.internal.dataObj = dataObj

  // Clean up the input text box
  module.exports.internal.seasonName.value = ''
  seasonNameOnInput()

  // generate the breadcrumb
  module.exports.internal.generateBreadcrumb()
}

/**
 * seasonAddOnClick - A click handler for when the "add season" button is clicked.  This only
 * acts if the season name text value contains more than 0 characters
 *
 * @private
 */
function seasonAddOnClick () {
  if (module.exports.internal.seasonName.value.length > 0) {
    module.exports.internal.dataObj.seasons = [
      {
        name: module.exports.internal.seasonName.value
      }
    ]
    debug('adding season ' + module.exports.internal.seasonName.value)
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
  spanHome.onclick = () => { module.exports.internal.stateManager.showState('add-first-season', 'pick-a-team') }
  module.exports.internal.breadcrumb.appendChild(spanHome)

  let spanSep1 = document.createElement('span')
  spanSep1.innerHTML = '&nbsp;&gt;&nbsp;'
  module.exports.internal.breadcrumb.appendChild(spanSep1)

  let spanTeam = document.createElement('span')
  spanTeam.innerHTML = module.exports.internal.dataObj.name
  module.exports.internal.breadcrumb.appendChild(spanTeam)
}

/**
 * attach - Set up any event handlers
 */
function attach () {
  debug('attaching add-first-season')
  ipc.on('team-data-saved', module.exports.internal.teamDataSavedListener)
  ipc.on('team-season-stored', module.exports.internal.teamSeasonStoreListener)
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener)
  ipc.send('get-team-data')
}

/**
 * detach - Clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach () {
  debug('detaching add-first-season')
  ipc.removeListener('team-data-saved', module.exports.internal.teamDataSavedListener)
  ipc.removeListener('team-season-stored', module.exports.internal.teamSeasonStoreListener)
  ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener)
  return Promise.resolve()
}

module.exports = {
  name: 'add-first-season',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    teamDataSavedListener: teamDataSavedListener,
    teamSeasonStoreListener: teamSeasonStoreListener,
    returnTeamDataListener: returnTeamDataListener,
    seasonAddOnClick: seasonAddOnClick,
    seasonNameOnInput: seasonNameOnInput,
    generateBreadcrumb: generateBreadcrumb,
    stateManager: undefined,
    seasonAddButton: undefined,
    seasonName: undefined,
    breadcrumb: undefined,
    filename: undefined,
    dataObj: undefined
  }
}
