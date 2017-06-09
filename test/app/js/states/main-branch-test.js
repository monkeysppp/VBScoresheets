'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);

const proxyquire = require('proxyquire').noCallThru();
const jsdomGlobal = require('jsdom-global');
const fs = require('fs');
const path = require('path');

describe('app/js/main-branch', () => {
  let jsdomCleanup;

  let mainBranch;

  let ipcRendererSendStub;
  let ipcRendererOnStub;
  let ipcRendererRemoveListenerStub;

  beforeEach(function (done) {
    this.timeout(10000);
    jsdomCleanup = jsdomGlobal();

    fs.readFile(path.join(__dirname, '..', '..', '..', '..', 'app', 'index.html'), {encodig: 'utf8'}, (err, index) => {
      if (err) {
        throw err;
      }
      document.body.innerHTML = index;
      done();
    });

    ipcRendererSendStub = sinon.stub();
    ipcRendererOnStub = sinon.stub();
    ipcRendererRemoveListenerStub = sinon.stub();
    mainBranch = proxyquire('../../../../app/js/states/main-branch.js',
      {
        electron: {
          ipcRenderer: {
            send: ipcRendererSendStub,
            on: ipcRendererOnStub,
            removeListener: ipcRendererRemoveListenerStub
          }
        }
      }
    );

    mainBranch.internal.stateManager = undefined;
    mainBranch.internal.players = undefined;
    mainBranch.internal.teams = undefined;
    mainBranch.internal.seasons = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof mainBranch.name).to.equal('string');
    expect(typeof mainBranch.state).to.equal('object');
    expect(typeof mainBranch.attach).to.equal('function');
    expect(typeof mainBranch.detach).to.equal('function');
    expect(typeof mainBranch.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers nothing', () => {
      mainBranch.attach();
      expect(ipcRendererOnStub).to.not.be.called;
    });
  });

  describe('#detach', () => {
    it('deregisters nothing', () => {
      mainBranch.detach();
      expect(ipcRendererRemoveListenerStub).to.not.be.called;
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {mainBranch.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        mainBranch.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(mainBranch.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the players div', () => {
        expect(mainBranch.internal.players).to.equal(document.getElementById('main-branch_players'));
      });

      it('finds the matches div', () => {
        expect(mainBranch.internal.matches).to.equal(document.getElementById('main-branch_matches'));
      });

      it('finds the seasons div', () => {
        expect(mainBranch.internal.seasons).to.equal(document.getElementById('main-branch_season'));
      });

      it('sets the players onclick listener for the div', () => {
        expect(mainBranch.internal.players.onclick).to.equal(mainBranch.internal.playersOnClick);
      });

      it('sets the matches onclick listener for the div', () => {
        expect(mainBranch.internal.matches.onclick).to.equal(mainBranch.internal.matchesOnClick);
      });

      it('sets the seasons onclick listener for the div', () => {
        expect(mainBranch.internal.seasons.onclick).to.equal(mainBranch.internal.seasonsOnClick);
      });
    });
  });

  describe('#playersOnClick', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      mainBranch.init(stateManagerStub);
    });

    it('calls to change state from main-branch to pick-a-player', () => {
      mainBranch.internal.playersOnClick();
      expect(showStateStub).to.be.calledWith('main-branch', 'pick-a-player');
    });
  });

  describe('#matchesOnClick', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      mainBranch.init(stateManagerStub);
    });

    it('calls to change state from main-branch to pick-a-matches', () => {
      mainBranch.internal.matchesOnClick();
      expect(showStateStub).to.be.calledWith('main-branch', 'pick-a-match');
    });
  });

  describe('#seasonsOnClick', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      mainBranch.init(stateManagerStub);
    });

    it('calls to change state from main-branch to season-stats', () => {
      mainBranch.internal.seasonsOnClick();
      expect(showStateStub).to.be.calledWith('main-branch', 'season-stats');
    });
  });

});
