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

describe('app/js/add-first-team', () => {
  let jsdomCleanup;

  let addFirstTeam;

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
    addFirstTeam = proxyquire('../../../../app/js/states/add-first-team.js',
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

    addFirstTeam.internal.stateManager = undefined;
    addFirstTeam.internal.teamAddButton = undefined;
    addFirstTeam.internal.teamName = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof addFirstTeam.name).to.equal('string');
    expect(typeof addFirstTeam.state).to.equal('object');
    expect(typeof addFirstTeam.attach).to.equal('function');
    expect(typeof addFirstTeam.detach).to.equal('function');
    expect(typeof addFirstTeam.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for team-data-saved', () => {
      addFirstTeam.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', addFirstTeam.internal.teamSaveListener);
    });
  });

  describe('#detach', () => {
    it('deregisters for team-data-saved', () => {
      addFirstTeam.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', addFirstTeam.internal.teamSaveListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {addFirstTeam.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        addFirstTeam.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(addFirstTeam.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the teamAdd button', () => {
        expect(addFirstTeam.internal.teamAddButton).to.equal(document.getElementById('button_add-first-team_add'));
      });

      it('finds the teamName textbox', () => {
        expect(addFirstTeam.internal.teamName).to.equal(document.getElementById('input_add-first-team'));
      });

      it('sets the teamAdd onclick listener for the button', () => {
        expect(addFirstTeam.internal.teamAddButton.onclick).to.equal(addFirstTeam.internal.teamAddOnClick);
      });

      it('sets the oninput listener for the input', () => {
        expect(addFirstTeam.internal.teamName.oninput).to.equal(addFirstTeam.internal.teamNameOnInput);
      });
    });
  });

  describe('#teamAddOnClick', () => {
    beforeEach(() => {
      addFirstTeam.init({});
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstTeam.internal.teamName.value = '';
        addFirstTeam.internal.teamAddOnClick();
      });

      it('disables the button', () => {
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstTeam.internal.teamName.value = 'abc';
        addFirstTeam.internal.teamAddOnClick();
      });

      it('enables the button', () => {
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', undefined, {name:'abc'});
      });
    });
  });

  describe('#teamNameOnInput', () => {
    beforeEach(() => {
      addFirstTeam.init({});
      addFirstTeam.internal.teamAddButton.className = 'null';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstTeam.internal.teamName.value = '';
        addFirstTeam.internal.teamNameOnInput();
      });

      it('sets the button class to disabled', () => {
        expect(addFirstTeam.internal.teamAddButton.className).to.equal('button new-item-button-disabled');
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstTeam.internal.teamName.value = 'abc';
        addFirstTeam.internal.teamNameOnInput();
      });

      it('sets the button class to enabled', () => {
        expect(addFirstTeam.internal.teamAddButton.className).to.equal('button new-item-button');
      });
    });
  });

  describe('#teamSaveListener', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      addFirstTeam.init(stateManagerStub);
    });

    it('calls to change state from add-first-team to add-first-season', () => {
      addFirstTeam.internal.teamSaveListener();
      expect(showStateStub).to.be.calledWith('add-first-team', 'add-first-season');
    });
  });

});
