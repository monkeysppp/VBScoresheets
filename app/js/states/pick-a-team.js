
'use strict'

const electron = require('electron')
const ipc = electron.ipcRenderer

const state = document.querySelector('.pick-a-team')
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

  module.exports.internal.teamAddButton = document.getElementById('button_pick-a-team_add')
  module.exports.internal.teamName = document.getElementById('input_pick-a-team')
  module.exports.internal.teamList = document.getElementById('pick-a-team_list')

  module.exports.internal.teamAddButton.onclick = module.exports.internal.teamAddOnClick
  module.exports.internal.teamName.oninput = module.exports.internal.teamNameOnInput
}

/**
 * returnTeamFilesListener - React to a return-team-files event by populating the team list div
 *
 * @param  {object} event        IPC Event
 * @param  {object} teamFileData data of the team names and their files
 * @private
 */
function returnTeamFilesListener (event, teamFileData) {
  // Clean up the input text box
  module.exports.internal.teamName.value = ''
  teamNameOnInput()

  // Clean up the list div
  let cloneTeamList = module.exports.internal.teamList.cloneNode(false)
  module.exports.internal.teamList.parentNode.replaceChild(cloneTeamList, module.exports.internal.teamList)
  module.exports.internal.teamList = cloneTeamList

  teamFileData.forEach((team) => {
    let span = document.createElement('span')
    span.innerHTML = team.teamname
    span.className = 'list-item'
    span.onclick = () => { ipc.send('load-team-data', team.filename) }
    module.exports.internal.teamList.appendChild(span)
  })
}

/**
 * teamDataSavedListener - Listener for when a new team is saved, and we should
 * load that file as if it had been selected.
 *
 * @param  {object} event    IPC Event
 * @param  {string} filename  the filename that was saved
 * @private
 */
function teamDataSavedListener (event, filename) {
  ipc.send('load-team-data', filename)
}

/**
 * returnTeamDataListener - Handle when a specific team's data is loaded.  This is done in reaction
 * to selecting a team, or adding a new team.
 *
 * @param  {object} event       IPC Event
 * @param  {string} filename    the filename that was loaded
 * @param  {object} teamDataObj the team data object that was loaded
 * @private
 */
function returnTeamDataListener (event, filename, teamDataObj) {
  if (teamDataObj.seasons && teamDataObj.seasons.length > 0) {
    return module.exports.internal.stateManager.showState('pick-a-team', 'pick-a-season')
  }
  module.exports.internal.stateManager.showState('pick-a-team', 'add-first-season')
}

/**
 * teamAddOnClick - A click handler for when the "add team" button is clicked.  This only
 * acts if the team name text value contains more than 0 characters
 *
 * @private
 */
function teamAddOnClick () {
  if (module.exports.internal.teamName.value.length > 0) {
    ipc.send('save-team-data', undefined, {name: module.exports.internal.teamName.value})
  }
}

/**
 * teamNameOnInput - An on-input handler for the team name text field.  This greys out the
 * "add" button when there is no text in the team name.
 *
 * @private
 */
function teamNameOnInput () {
  if (module.exports.internal.teamName.value.length === 0) {
    module.exports.internal.teamAddButton.className = 'button new-item-button-disabled'
  } else {
    module.exports.internal.teamAddButton.className = 'button new-item-button'
  }
}

/**
 * attach - attach the state code to the displayed ui and set up any event handlers
 */
function attach () {
  debug('attaching pick-a-team')
  ipc.on('return-team-files', module.exports.internal.returnTeamFilesListener)
  ipc.on('team-data-saved', module.exports.internal.teamDataSavedListener)
  ipc.on('return-team-data', module.exports.internal.returnTeamDataListener)
  ipc.send('get-team-files')
}

/**
 * detach - detach the state code from the displayed ui and clean up any event handlers
 *
 * @return {Promise} a promise to have detached the state
 */
function detach () {
  debug('detaching pick-a-team')
  ipc.removeListener('return-team-files', module.exports.internal.returnTeamFilesListener)
  ipc.removeListener('team-data-saved', module.exports.internal.teamDataSavedListener)
  ipc.removeListener('return-team-data', module.exports.internal.returnTeamDataListener)
  return Promise.resolve()
}

module.exports = {
  name: 'pick-a-team',
  state: state,
  init: init,
  attach: attach,
  detach: detach,
  internal: {
    returnTeamFilesListener: returnTeamFilesListener,
    teamDataSavedListener: teamDataSavedListener,
    returnTeamDataListener: returnTeamDataListener,
    teamAddOnClick: teamAddOnClick,
    teamNameOnInput: teamNameOnInput,
    stateManager: undefined,
    teamAddButton: undefined,
    teamName: undefined,
    teamList: undefined
  }
}
