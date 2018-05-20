'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(chaiAsPromised)
chai.use(sinonChai)

const proxyquire = require('proxyquire').noCallThru()
const jsdomGlobal = require('jsdom-global')
const fs = require('fs')
const path = require('path')

describe('app/js/add-first-squad', () => {
  let jsdomCleanup

  let addFirstSquad

  let ipcRendererSendStub
  let ipcRendererOnStub
  let ipcRendererRemoveListenerStub

  beforeEach(function (done) {
    this.timeout(10000)
    jsdomCleanup = jsdomGlobal()

    fs.readFile(path.join(__dirname, '..', '..', '..', '..', 'app', 'index.html'), {encodig: 'utf8'}, (err, index) => {
      if (err) {
        throw err
      }
      document.body.innerHTML = index
      done()
    })

    ipcRendererSendStub = sinon.stub()
    ipcRendererOnStub = sinon.stub()
    ipcRendererRemoveListenerStub = sinon.stub()
    addFirstSquad = proxyquire('../../../../app/js/states/add-first-squad.js',
      {
        electron: {
          ipcRenderer: {
            send: ipcRendererSendStub,
            on: ipcRendererOnStub,
            removeListener: ipcRendererRemoveListenerStub
          }
        }
      }
    )

    addFirstSquad.internal.stateManager = undefined
    addFirstSquad.internal.playerAddButton = undefined
    addFirstSquad.internal.playerName = undefined
    addFirstSquad.internal.playerList = undefined
    addFirstSquad.internal.doneButton = undefined
    addFirstSquad.internal.breadcrumb = undefined
    addFirstSquad.internal.pageComplete = undefined
    addFirstSquad.internal.filename = undefined
    addFirstSquad.internal.dataObj = undefined
    addFirstSquad.internal.seasonId = undefined
  })

  afterEach(() => {
    jsdomCleanup()
  })

  it('returns a state handler', () => {
    expect(typeof addFirstSquad.name).to.equal('string')
    expect(typeof addFirstSquad.state).to.equal('object')
    expect(typeof addFirstSquad.attach).to.equal('function')
    expect(typeof addFirstSquad.detach).to.equal('function')
    expect(typeof addFirstSquad.init).to.equal('function')
  })

  describe('#attach', () => {
    it('registers for return-team-data', () => {
      addFirstSquad.attach()
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', addFirstSquad.internal.returnTeamDataListener)
    })

    it('registers for team-data-saved', () => {
      addFirstSquad.attach()
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', addFirstSquad.internal.teamDataSavedListener)
    })

    it('sends a get-team-data event', () => {
      addFirstSquad.attach()
      expect(ipcRendererSendStub.callCount).to.equal(1)
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data')
    })
  })

  describe('#detach', () => {
    it('returns a Promise', () => {
      return expect(addFirstSquad.detach()).to.not.be.rejected
    })

    it('deregisters for return-team-data', () => {
      return expect(addFirstSquad.detach()).to.not.be.rejected
        .then(() => {
          expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', addFirstSquad.internal.returnTeamDataListener)
        })
    })

    it('deregisters for team-data-saved', () => {
      return expect(addFirstSquad.detach()).to.not.be.rejected
        .then(() => {
          expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', addFirstSquad.internal.teamDataSavedListener)
        })
    })
  })

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => { addFirstSquad.init() }).to.throw('no state-manager given')
      })
    })

    context('called with a state-manager', () => {
      let stateManagerStub

      beforeEach(() => {
        stateManagerStub = {}
        addFirstSquad.init(stateManagerStub)
      })

      it('saves the state manager', () => {
        expect(addFirstSquad.internal.stateManager).to.equal(stateManagerStub)
      })

      it('finds the playerAdd button', () => {
        expect(addFirstSquad.internal.playerAddButton).to.equal(document.getElementById('button_add-first-squad_add'))
      })

      it('finds the playerName textbox', () => {
        expect(addFirstSquad.internal.playerName).to.equal(document.getElementById('input_add-first-squad'))
      })

      it('finds the done button', () => {
        expect(addFirstSquad.internal.doneButton).to.equal(document.getElementById('button_add-first-squad_done'))
      })

      it('finds the playerList div', () => {
        expect(addFirstSquad.internal.playerList).to.equal(document.getElementById('add-first-squad_list'))
      })

      it('finds the breadcrumb div', () => {
        expect(addFirstSquad.internal.breadcrumb).to.equal(document.getElementById('add-first-squad_breadcrumbs'))
      })

      it('sets the playerAdd onclick listener for the button', () => {
        expect(addFirstSquad.internal.playerAddButton.onclick).to.equal(addFirstSquad.internal.playerAddOnClick)
      })

      it('sets the oninput listener for the input', () => {
        expect(addFirstSquad.internal.playerName.oninput).to.equal(addFirstSquad.internal.playerNameOnInput)
      })

      it('sets the done onclick listener for the button', () => {
        expect(addFirstSquad.internal.doneButton.onclick).to.equal(addFirstSquad.internal.doneOnClick)
      })
    })
  })

  describe('#generateBreadcrumb', () => {
    let stateManagerStub
    let showStateStub
    let dataObj
    let breadcrumbParts

    beforeEach(() => {
      showStateStub = sinon.stub()
      stateManagerStub = {
        showState: showStateStub
      }
      dataObj = {
        name: 'team1',
        seasons: [
          {name: 'season1'}
        ]
      }
      addFirstSquad.internal.dataObj = dataObj
      addFirstSquad.internal.seasonId = 0
      addFirstSquad.init(stateManagerStub)
      addFirstSquad.internal.generateBreadcrumb()
      breadcrumbParts = document.getElementById('add-first-squad_breadcrumbs').childNodes
    })

    it('generates a breadcrumb', () => {
      expect(breadcrumbParts[0].innerHTML).to.equal('Home')
      expect(breadcrumbParts[2].innerHTML).to.equal(dataObj.name)
      expect(breadcrumbParts[4].innerHTML).to.equal(dataObj.seasons[0].name)
    })

    it('cleans out the old breadcrumb on each call', () => {
      addFirstSquad.internal.generateBreadcrumb()
      addFirstSquad.internal.generateBreadcrumb()
      expect(breadcrumbParts.length).to.equal(5)
    })

    it('makes the home button show "pick-a-team"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function')
      breadcrumbParts[0].onclick()
      expect(showStateStub).to.be.calledWith('add-first-squad', 'pick-a-team')
    })

    it('makes the team button show "pick-a-season"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function')
      breadcrumbParts[2].onclick()
      expect(showStateStub).to.be.calledWith('add-first-squad', 'pick-a-season')
    })
  })

  describe('#playerAddOnClick', () => {
    let startingDataObj
    let expectedDataObj1
    let expectedDataObj2

    beforeEach(() => {
      startingDataObj = {
        name: 'team1',
        seasons: [{name: 'xyz'}, {name: 'abc'}]
      }
      expectedDataObj1 = {
        name: 'team1',
        seasons: [{
          name: 'xyz'
        }, {
          name: 'abc',
          players: [
            {'id': 1, 'name': 'Alice Alison'}
          ]
        }]
      }
      expectedDataObj2 = {
        name: 'team1',
        seasons: [{
          name: 'xyz'
        }, {
          name: 'abc',
          players: [
            {'id': 1, 'name': 'Alice Alison'},
            {'id': 2, 'name': 'Bob Roberts'}
          ]
        }]
      }
      addFirstSquad.init({})
      addFirstSquad.internal.filename = 'someFileName'
      addFirstSquad.internal.seasonId = 1
      addFirstSquad.internal.dataObj = startingDataObj
    })

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = ''
        addFirstSquad.internal.playerAddOnClick()
      })

      it('disables the button', () => {
        expect(ipcRendererSendStub.callCount).to.equal(0)
      })
    })

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = 'Alice Alison'
        addFirstSquad.internal.playerAddOnClick()
      })

      it('enables the button', () => {
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFileName', expectedDataObj1)
      })

      it('adds players to the list', () => {
        addFirstSquad.internal.playerName.value = 'Bob Roberts'
        addFirstSquad.internal.playerAddOnClick()
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFileName', expectedDataObj2)
      })
    })
  })

  describe('#playerNameOnInput', () => {
    beforeEach(() => {
      addFirstSquad.init({})
      addFirstSquad.internal.playerAddButton.className = 'null'
    })

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = ''
        addFirstSquad.internal.playerName.oninput()
      })

      it('sets the button class to disabled', () => {
        expect(addFirstSquad.internal.playerAddButton.className).to.equal('button new-item-button-disabled')
      })
    })

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = 'abc'
        addFirstSquad.internal.playerName.oninput()
      })

      it('sets the button class to enabled', () => {
        expect(addFirstSquad.internal.playerAddButton.className).to.equal('button new-item-button')
      })
    })
  })

  describe('#doneOnClick', () => {
    let stateManagerStub
    let showStateStub

    beforeEach(() => {
      showStateStub = sinon.stub()
      stateManagerStub = {
        showState: showStateStub
      }
      addFirstSquad.init(stateManagerStub)
    })

    context('if the page is complete', () => {
      beforeEach(() => {
        addFirstSquad.internal.pageComplete = true
      })

      it('calls to change state from add-first-squad to add-first-match', () => {
        addFirstSquad.internal.doneOnClick()
        expect(showStateStub).to.be.calledWith('add-first-squad', 'add-first-match')
      })
    })

    context('if the page is not complete', () => {
      beforeEach(() => {
        addFirstSquad.internal.pageComplete = false
      })

      it('does not change the state', () => {
        addFirstSquad.internal.doneOnClick()
        expect(showStateStub.callCount).to.equal(0)
      })
    })
  })

  describe('#teamDataSavedListener', () => {
    beforeEach(() => {
      addFirstSquad.init({})
    })

    it('calls to load the team data', () => {
      addFirstSquad.internal.teamDataSavedListener()
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data')
    })
  })

  describe('#returnTeamDataListener', () => {
    let dataObj = {
      name: 'team1',
      seasons: [
        {
          name: 'season1',
          players: [
            {id: 1, name: 'Alice Alison'}
          ]
        },
        {
          name: 'season2',
          players: [
            {id: 1, name: 'Alice Alison'},
            {id: 2, name: 'Bob Roberts'},
            {id: 3, name: 'Charlie Charlson'},
            {id: 4, name: 'Debbie Davis'},
            {id: 5, name: 'Emma Emerton'}
          ]
        },
        {
          name: 'season3',
          players: [
            {id: 1, name: 'Alice Alison'},
            {id: 2, name: 'Bob Roberts'},
            {id: 3, name: 'Charlie Charlson'},
            {id: 4, name: 'Debbie Davis'},
            {id: 5, name: 'Emma Emerton'},
            {id: 6, name: 'Freda Ferguson'}
          ]
        },
        {
          name: 'season4'
        }
      ]
    }
    let stateManagerStub
    let generateBreadcrumbStub

    beforeEach(() => {
      stateManagerStub = {}
      addFirstSquad.internal.dataObj = {}
      addFirstSquad.internal.filename = 'foo'
      addFirstSquad.internal.seasonId = 0
      generateBreadcrumbStub = sinon.stub(addFirstSquad.internal, 'generateBreadcrumb')
      addFirstSquad.init(stateManagerStub)
    })

    afterEach(() => {
      generateBreadcrumbStub.restore()
    })

    it('locally stores the team data', () => {
      addFirstSquad.internal.returnTeamDataListener(undefined, undefined, dataObj, 0)
      expect(addFirstSquad.internal.dataObj).to.deep.equal(dataObj)
    })

    it('locally stores the filename', () => {
      addFirstSquad.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 0)
      expect(addFirstSquad.internal.filename).to.equal('someFileName')
    })

    it('locally stores the seasonId', () => {
      addFirstSquad.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 2)
      expect(addFirstSquad.internal.seasonId).to.equal(2)
    })

    it('clears the curent playerName input and add button', () => {
      addFirstSquad.internal.playerName.value = 'sometext'
      addFirstSquad.internal.returnTeamDataListener(undefined, undefined, dataObj, 0)
      expect(addFirstSquad.internal.playerName.value).to.equal('')
      expect(addFirstSquad.internal.playerAddButton.className).to.equal('button new-item-button-disabled')
    })

    it('calls to generate the breadcrumb', () => {
      addFirstSquad.internal.returnTeamDataListener(undefined, undefined, dataObj, 0)
      expect(generateBreadcrumbStub.callCount).to.equal(1)
    })

    context('when no players exist', () => {
      beforeEach(() => {
        addFirstSquad.internal.returnTeamDataListener(undefined, undefined, dataObj, 3)
      })

      it('does not enable the done button', () => {
        expect(addFirstSquad.internal.pageComplete).to.equal(false)
        expect(addFirstSquad.internal.doneButton.className).to.equal('button done-button-disabled')
      })
    })

    context('when 5 players exist', () => {
      beforeEach(() => {
        addFirstSquad.internal.returnTeamDataListener(undefined, undefined, dataObj, 1)
      })

      it('adds the players to the list', () => {
        expect(addFirstSquad.internal.playerList.childNodes.length).to.equal(5)
      })

      it('does not enable the done button', () => {
        expect(addFirstSquad.internal.pageComplete).to.equal(false)
        expect(addFirstSquad.internal.doneButton.className).to.equal('button done-button-disabled')
      })
    })

    context('when 6 players exist', () => {
      beforeEach(() => {
        addFirstSquad.internal.returnTeamDataListener(undefined, undefined, dataObj, 2)
      })

      it('enables the done button', () => {
        expect(addFirstSquad.internal.pageComplete).to.equal(true)
        expect(addFirstSquad.internal.doneButton.className).to.equal('button done-button')
      })
    })
  })
})
