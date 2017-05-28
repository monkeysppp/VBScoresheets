'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = require('chai').expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const proxyquire = require('proxyquire').noCallThru();

describe('app/js/state-manager', () => {
  let stateManager;

  let addFirstTeamInitStub;
  let addFirstSeasonInitStub;
  let addFirstMatchInitStub;
  let pickATeamInitStub;
  let pickASeasonInitStub;
  let pickAMatchInitStub;
  let loadingInitStub;

  let expectedStates;

  beforeEach(() => {
    addFirstTeamInitStub = sinon.stub();
    addFirstSeasonInitStub = sinon.stub();
    addFirstMatchInitStub = sinon.stub();
    pickATeamInitStub = sinon.stub();
    pickASeasonInitStub = sinon.stub();
    pickAMatchInitStub = sinon.stub();
    loadingInitStub = sinon.stub();

    stateManager = proxyquire('../../../app/js/state-manager.js',
      {
        './add-first-team.js': {init: addFirstTeamInitStub},
        './add-first-season.js': {init: addFirstSeasonInitStub},
        './add-first-match.js': {init: addFirstMatchInitStub},
        './pick-a-team.js': {init: pickATeamInitStub},
        './pick-a-season.js': {init: pickASeasonInitStub},
        './pick-a-match.js': {init: pickAMatchInitStub},
        './loading.js': {init: loadingInitStub}
      }
    );

    expectedStates = [
      'add-first-team',
      'pick-a-team',
      'add-first-season',
      'pick-a-season',
      'add-first-match',
      'pick-a-match',
      'loading'
    ];
  });

  afterEach(() => {
  });

  it('has a getStateManager function', () => {
    expect(typeof stateManager.getStateManager).to.equal('function');
  });

  describe('#init', () => {
    it('initializes all pages', () => {
      stateManager.internal.init();

      expect(addFirstTeamInitStub).to.be.calledOnce;
      expect(addFirstSeasonInitStub).to.be.calledOnce;
      expect(addFirstMatchInitStub).to.be.calledOnce;
      expect(pickATeamInitStub).to.be.calledOnce;
      expect(pickASeasonInitStub).to.be.calledOnce;
      expect(pickAMatchInitStub).to.be.calledOnce;
      expect(loadingInitStub).to.be.calledOnce;
    });
  });

  describe('#showState', () => {
    let manager;
    let originalStates;
    let fromAttachStub;
    let fromDetachStub;
    let toAttachStub;
    let toDetachStub;


    beforeEach(() => {
      fromAttachStub = sinon.stub();
      fromDetachStub = sinon.stub();
      toAttachStub = sinon.stub();
      toDetachStub = sinon.stub();

      manager = stateManager.getStateManager();
      originalStates = manager.states;
      manager.states = {
        from: {
          attach: fromAttachStub,
          detach: fromDetachStub,
          state: {style:{display:'start'}}
        },
        to: {
          attach: toAttachStub,
          detach: toDetachStub,
          state: {style:{display:'start'}}
        }
      };
    });

    afterEach(() => {
      manager.states = originalStates;
    });

    context('when called with one argument', () => {
      it('only turns on that state', () => {
        manager.showState('to');
        expect(fromAttachStub).to.not.be.called;
        expect(fromDetachStub).to.not.be.called;
        expect(toAttachStub).to.be.calledOnce;
        expect(toDetachStub).to.not.be.called;
        expect(manager.states.to.state.style.display).to.equal('block');
        expect(manager.states.from.state.style.display).to.equal('start');
      });
    });

    context('when called with 2 states', () => {
      it('turns off from and turns on to', () => {
        manager.showState('from', 'to');
        expect(fromAttachStub).to.not.be.called;
        expect(fromDetachStub).to.be.calledOnce;
        expect(toAttachStub).to.be.calledOnce;
        expect(toDetachStub).to.not.be.called;
        expect(manager.states.to.state.style.display).to.equal('block');
        expect(manager.states.from.state.style.display).to.equal('none');
      });
    });
  });

  describe('#getStateManager', () => {
    let initStub;

    beforeEach(() => {
      initStub = sinon.stub(stateManager.internal, 'init');
    });

    afterEach(() => {
      initStub.restore();
    });

    context('when called once', () => {
      it('returns a state-manager', () => {
        let manager = stateManager.getStateManager();
        expect(typeof manager.showState).to.equal('function');
        expect(typeof manager.states).to.equal('object');
        expectedStates.forEach((expectedState) => {
          expect(manager.states[expectedState]).not.to.equal(undefined);
        });
      });

      it('calls init', () => {
        stateManager.getStateManager();
        expect(initStub).to.be.calledOnce;
      });
    });

    context('when called twice', () => {
      it('returns the same object', () => {
        let manager1 = stateManager.getStateManager();
        let manager2 = stateManager.getStateManager();
        expect(manager1).to.equal(manager2);
      });

      it('calls init once', () => {
        stateManager.getStateManager();
        stateManager.getStateManager();
        expect(initStub).to.be.calledOnce;
      });
    });
  });

});
