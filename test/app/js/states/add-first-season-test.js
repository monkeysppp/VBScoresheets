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

describe('app/js/add-first-season', () => {
  let jsdomCleanup;

  let addFirstSeason;

  let ipcRendererSendStub;
  let ipcRendererOnStub;
  let ipcRendererRemoveListenerStub;

  beforeEach(function () {
    this.timeout(10000);
    jsdomCleanup = jsdomGlobal();
    document.body.innerHTML = '<div class="add-first-team"><input id="input_add-first-season"/><button class="button new-item-button-disabled" id="button_add-first-season">+</button></div>';
    ipcRendererSendStub = sinon.stub();
    ipcRendererOnStub = sinon.stub();
    ipcRendererRemoveListenerStub = sinon.stub();
    addFirstSeason = proxyquire('../../../../app/js/states/add-first-season.js',
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
    expect(typeof addFirstSeason.name).to.equal('string');
    expect(typeof addFirstSeason.state).to.equal('object');
    expect(typeof addFirstSeason.attach).to.equal('function');
    expect(typeof addFirstSeason.detach).to.equal('function');
    expect(typeof addFirstSeason.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for team-data-saved', () => {
      addFirstSeason.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', addFirstSeason.internal.teamSaveListener);
    });
  });

  describe('#detach', () => {
    it('deregisters for team-data-saved', () => {
      addFirstSeason.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', addFirstSeason.internal.teamSaveListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {addFirstSeason.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;
      let seasonAddedButton;
      let seasonName;

      beforeEach(() => {
        stateManagerStub = {};
        seasonAddedButton = document.getElementById('button_add-first-season');
        seasonName = document.getElementById('input_add-first-season');
      });

      it('saves the state manager', () => {
        addFirstSeason.init(stateManagerStub);
        expect(addFirstSeason.internal.stateManager).to.equal(stateManagerStub);
      });

      it('sets an onclick listener for the button', () => {
        addFirstSeason.init(stateManagerStub);
        expect(typeof seasonAddedButton.onclick).to.equal('function');
      });

      context('the onclick listener', () => {
        beforeEach(() => {
          addFirstSeason.init(stateManagerStub);
        });

        context('when input is zero length', () => {
          beforeEach(() => {
            seasonName.value = '';
            seasonAddedButton.onclick();
          });

          it('disables the button', () => {
            expect(ipcRendererSendStub).to.not.be.called;
          });
        });

        context('when input is longer than zero length', () => {
          beforeEach(() => {
            seasonName.value = 'abc';
            seasonAddedButton.onclick();
          });

          it('enables the button', () => {
            expect(ipcRendererSendStub).to.be.calledWith('save-team-data', undefined, {name:'abc'});
          });
        });
      });

      it('sets an oninput listener for the input', () => {
        addFirstSeason.init(stateManagerStub);
        expect(typeof seasonName.oninput).to.equal('function');
      });

      context('the oninput listener', () => {
        beforeEach(() => {
          addFirstSeason.init(stateManagerStub);
          seasonAddedButton.className = 'null';
        });

        context('when input is zero length', () => {
          beforeEach(() => {
            seasonName.value = '';
            seasonName.oninput();
          });

          it('sets the button class to disabled', () => {
            expect(seasonAddedButton.className).to.equal('button new-item-button-disabled');
          });
        });

        context('when input is longer than zero length', () => {
          beforeEach(() => {
            seasonName.value = 'abc';
            seasonName.oninput();
          });

          it('sets the button class to enabled', () => {
            expect(seasonAddedButton.className).to.equal('button new-item-button');
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
      addFirstSeason.init(stateManagerStub);
    });

    it('calls to change state from add-first-season to add-first-match', () => {
      addFirstSeason.internal.teamSaveListener();
      expect(showStateStub).to.be.calledWith('add-first-season', 'add-first-match');
    });
  });

});
