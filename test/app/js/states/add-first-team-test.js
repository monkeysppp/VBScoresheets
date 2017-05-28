'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = require('chai').expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);

const proxyquire = require('proxyquire').noCallThru();
const jsdomGlobal = require('jsdom-global');

describe('app/js/add-first-team', () => {
  let jsdomCleanup;

  let addFirstTeam;

  let ipcRendererSendStub;
  let ipcRendererOnStub;
  let ipcRendererRemoveListenerStub;

  beforeEach(function () {
    this.timeout(10000);
    jsdomCleanup = jsdomGlobal();
    document.body.innerHTML = '<div class="add-first-team"><input id="input_add-first-team"/><button class="button new-item-button-disabled" id="button_add-first-team">+</button></div>';
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
      let teamAddedButton;
      let teamName;

      beforeEach(() => {
        stateManagerStub = {};
        teamAddedButton = document.getElementById('button_add-first-team');
        teamName = document.getElementById('input_add-first-team');
      });

      it('saves the state manager', () => {
        addFirstTeam.init(stateManagerStub);
        expect(addFirstTeam.internal.stateManager).to.equal(stateManagerStub);
      });

      it('sets an onclick listener for the button', () => {
        addFirstTeam.init(stateManagerStub);
        expect(typeof teamAddedButton.onclick).to.equal('function');
      });

      context('the onclick listener', () => {
        beforeEach(() => {
          addFirstTeam.init(stateManagerStub);
        });

        context('when input is zero length', () => {
          beforeEach(() => {
            teamName.value = '';
            teamAddedButton.onclick();
          });

          it('disables the button', () => {
            expect(ipcRendererSendStub).to.not.be.called;
          });
        });

        context('when input is longer than zero length', () => {
          beforeEach(() => {
            teamName.value = 'abc';
            teamAddedButton.onclick();
          });

          it('enables the button', () => {
            expect(ipcRendererSendStub).to.be.calledWith('save-team-data', undefined, {name:'abc'});
          });
        });
      });

      it('sets an oninput listener for the input', () => {
        addFirstTeam.init(stateManagerStub);
        expect(typeof teamName.oninput).to.equal('function');
      });

      context('the oninput listener', () => {
        beforeEach(() => {
          addFirstTeam.init(stateManagerStub);
          teamAddedButton.className = 'null';
        });

        context('when input is zero length', () => {
          beforeEach(() => {
            teamName.value = '';
            teamName.oninput();
          });

          it('sets the button class to disabled', () => {
            expect(teamAddedButton.className).to.equal('button new-item-button-disabled');
          });
        });

        context('when input is longer than zero length', () => {
          beforeEach(() => {
            teamName.value = 'abc';
            teamName.oninput();
          });

          it('sets the button class to enabled', () => {
            expect(teamAddedButton.className).to.equal('button new-item-button');
          });
        });
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
