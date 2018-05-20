'use strict'

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
const expect = chai.expect
const sinon = require('sinon')
const sinonChai = require('sinon-chai')
chai.use(chaiAsPromised)
chai.use(sinonChai)
const proxyquire = require('proxyquire').noCallThru()

describe('app/js/state-manager', () => {
  let stateManager

  let addFirstMatchInitStub
  let addFirstSeasonInitStub
  let addFirstSquadInitStub
  let addFirstTeamInitStub
  let loadingInitStub
  let mainBranchStub
  let matchEditorStub
  let matchStatsStub
  let pickAMatchInitStub
  let pickAPlayerInitStub
  let pickASeasonInitStub
  let pickATeamInitStub
  let playerStatsStub
  let seasonStatsStub

  let expectedStates

  beforeEach(() => {
    addFirstMatchInitStub = sinon.stub()
    addFirstSeasonInitStub = sinon.stub()
    addFirstSquadInitStub = sinon.stub()
    addFirstTeamInitStub = sinon.stub()
    loadingInitStub = sinon.stub()
    mainBranchStub = sinon.stub()
    matchEditorStub = sinon.stub()
    matchStatsStub = sinon.stub()
    pickAMatchInitStub = sinon.stub()
    pickAPlayerInitStub = sinon.stub()
    pickASeasonInitStub = sinon.stub()
    pickATeamInitStub = sinon.stub()
    playerStatsStub = sinon.stub()
    seasonStatsStub = sinon.stub()

    stateManager = proxyquire('../../../app/js/state-manager.js',
      {
        './states/add-first-match.js': {init: addFirstMatchInitStub, name: 'add-first-match'},
        './states/add-first-season.js': {init: addFirstSeasonInitStub, name: 'add-first-season'},
        './states/add-first-squad.js': {init: addFirstSquadInitStub, name: 'add-first-squad'},
        './states/add-first-team.js': {init: addFirstTeamInitStub, name: 'add-first-team'},
        './states/loading.js': {init: loadingInitStub, name: 'loading'},
        './states/main-branch.js': {init: mainBranchStub, name: 'main-branch'},
        './states/match-editor.js': {init: matchEditorStub, name: 'match-editor'},
        './states/match-stats.js': {init: matchStatsStub, name: 'match-stats'},
        './states/pick-a-match.js': {init: pickAMatchInitStub, name: 'pick-a-match'},
        './states/pick-a-player.js': {init: pickAPlayerInitStub, name: 'pick-a-player'},
        './states/pick-a-season.js': {init: pickASeasonInitStub, name: 'pick-a-season'},
        './states/pick-a-team.js': {init: pickATeamInitStub, name: 'pick-a-team'},
        './states/player-stats.js': {init: playerStatsStub, name: 'player-stats'},
        './states/season-stats.js': {init: seasonStatsStub, name: 'season-stats'}
      }
    )

    expectedStates = [
      'add-first-match',
      'add-first-season',
      'add-first-squad',
      'add-first-team',
      'loading',
      'main-branch',
      'match-editor',
      'match-stats',
      'pick-a-match',
      'pick-a-player',
      'pick-a-season',
      'pick-a-team',
      'player-stats',
      'season-stats'
    ]
  })

  afterEach(() => {
  })

  it('has a getStateManager function', () => {
    expect(typeof stateManager.getStateManager).to.equal('function')
  })

  describe('#init', () => {
    it('initializes all pages', () => {
      stateManager.internal.init()

      expect(addFirstMatchInitStub.callCount).to.equal(1)
      expect(addFirstSeasonInitStub.callCount).to.equal(1)
      expect(addFirstSquadInitStub.callCount).to.equal(1)
      expect(addFirstTeamInitStub.callCount).to.equal(1)
      expect(loadingInitStub.callCount).to.equal(1)
      expect(mainBranchStub.callCount).to.equal(1)
      expect(matchEditorStub.callCount).to.equal(1)
      expect(matchStatsStub.callCount).to.equal(1)
      expect(pickAMatchInitStub.callCount).to.equal(1)
      expect(pickAPlayerInitStub.callCount).to.equal(1)
      expect(pickASeasonInitStub.callCount).to.equal(1)
      expect(pickATeamInitStub.callCount).to.equal(1)
      expect(playerStatsStub.callCount).to.equal(1)
      expect(seasonStatsStub.callCount).to.equal(1)
    })
  })

  describe('#showState', () => {
    let manager
    let originalStates
    let fromAttachStub
    let fromDetachStub
    let toAttachStub
    let toDetachStub

    beforeEach(() => {
      fromAttachStub = sinon.stub()
      fromDetachStub = sinon.stub().returns(Promise.resolve())
      toAttachStub = sinon.stub()
      toDetachStub = sinon.stub().returns(Promise.resolve())

      manager = stateManager.getStateManager()
      originalStates = manager.states
      manager.states = {
        from: {
          attach: fromAttachStub,
          detach: fromDetachStub,
          state: {style: {display: 'start'}}
        },
        to: {
          attach: toAttachStub,
          detach: toDetachStub,
          state: {style: {display: 'start'}}
        }
      }
    })

    afterEach(() => {
      manager.states = originalStates
    })

    context('when called with one state', () => {
      it('only turns on that state', () => {
        return expect(manager.showState('to')).to.not.be.rejected
          .then(() => {
            expect(fromAttachStub.callCount).to.equal(0)
            expect(fromDetachStub.callCount).to.equal(0)
            expect(toAttachStub.callCount).to.equal(1)
            expect(toDetachStub.callCount).to.equal(0)
            expect(manager.states.to.state.style.display).to.equal('block')
            expect(manager.states.from.state.style.display).to.equal('start')
          })
      })
    })

    context('when called with 2 states', () => {
      it('turns off from and turns on to', () => {
        return expect(manager.showState('from', 'to')).to.not.be.rejected
          .then(() => {
            expect(fromAttachStub.callCount).to.equal(0)
            expect(fromDetachStub.callCount).to.equal(1)
            expect(toAttachStub.callCount).to.equal(1)
            expect(toDetachStub.callCount).to.equal(0)
            expect(manager.states.to.state.style.display).to.equal('block')
            expect(manager.states.from.state.style.display).to.equal('none')
          })
      })
    })
  })

  describe('#getStateManager', () => {
    let initStub

    beforeEach(() => {
      initStub = sinon.stub(stateManager.internal, 'init')
    })

    afterEach(() => {
      initStub.restore()
    })

    context('when called once', () => {
      it('returns a state-manager', () => {
        let manager = stateManager.getStateManager()
        expect(typeof manager.showState).to.equal('function')
        expect(typeof manager.states).to.equal('object')
        expectedStates.forEach((expectedState) => {
          expect(manager.states[expectedState]).not.to.equal(undefined)
          expect(manager.states[expectedState].name).to.equal(expectedState)
        })
      })

      it('calls init', () => {
        stateManager.getStateManager()
        expect(initStub.callCount).to.equal(1)
      })
    })

    context('when called twice', () => {
      it('returns the same object', () => {
        let manager1 = stateManager.getStateManager()
        let manager2 = stateManager.getStateManager()
        expect(manager1).to.equal(manager2)
      })

      it('calls init once', () => {
        stateManager.getStateManager()
        stateManager.getStateManager()
        expect(initStub.callCount).to.equal(1)
      })
    })
  })
})
