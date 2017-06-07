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

describe('app/js/add-first-squad', () => {
  let jsdomCleanup;

  let addFirstSquad;

  let ipcRendererSendStub;
  let ipcRendererOnStub;
  let ipcRendererRemoveListenerStub;

  beforeEach(function () {
    this.timeout(10000);
    jsdomCleanup = jsdomGlobal();
    document.body.innerHTML = '<div class="state add-first-squad"><input id="input_add-first-squad"/><button class="button new-item-button-disabled" id="button_add-first-squad_add">+</button><div id="add-first-squad_list" class="scrollable player-list"></div><button class="button done-button-disabled" id="button_add-first-squad_done">+</button>';
    ipcRendererSendStub = sinon.stub();
    ipcRendererOnStub = sinon.stub();
    ipcRendererRemoveListenerStub = sinon.stub();
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
    );
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof addFirstSquad.name).to.equal('string');
    expect(typeof addFirstSquad.state).to.equal('object');
    expect(typeof addFirstSquad.attach).to.equal('function');
    expect(typeof addFirstSquad.detach).to.equal('function');
    expect(typeof addFirstSquad.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for return-team-data', () => {
      addFirstSquad.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', addFirstSquad.internal.teamGetListener);
    });

    it('registers for team-data-saved', () => {
      addFirstSquad.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', addFirstSquad.internal.teamSaveListener);
    });

    it('sends a get-team-data event', () => {
      addFirstSquad.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#detach', () => {
    it('deregisters for return-team-data', () => {
      addFirstSquad.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', addFirstSquad.internal.teamGetListener);
    });

    it('deregisters for team-data-saved', () => {
      addFirstSquad.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', addFirstSquad.internal.teamSaveListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {addFirstSquad.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        addFirstSquad.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(addFirstSquad.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the playerAdd button', () => {
        expect(addFirstSquad.internal.playerAddButton).to.equal(document.getElementById('button_add-first-squad_add'));
      });

      it('finds the playerName textbox', () => {
        expect(addFirstSquad.internal.playerName).to.equal(document.getElementById('input_add-first-squad'));
      });

      it('finds the done button', () => {
        expect(addFirstSquad.internal.doneButton).to.equal(document.getElementById('button_add-first-squad_done'));
      });

      it('finds the playerList div', () => {
        expect(addFirstSquad.internal.playerList).to.equal(document.getElementById('add-first-squad_list'));
      });

      it('sets the playerAdd onclick listener for the button', () => {
        expect(addFirstSquad.internal.playerAddButton.onclick).to.equal(addFirstSquad.internal.playerAddOnClick);
      });

      it('sets the oninput listener for the input', () => {
        expect(addFirstSquad.internal.playerName.oninput).to.equal(addFirstSquad.internal.playerNameOnInput);
      });

      it('sets the done onclick listener for the button', () => {
        expect(addFirstSquad.internal.doneButton.onclick).to.equal(addFirstSquad.internal.doneOnClick);
      });
    });
  });

  describe('#playerAddOnClick', () => {
    let startingDataObj;
    let expectedDataObj1;
    let expectedDataObj2;

    beforeEach(() => {
      startingDataObj = {
        name:'team1',
        seasons:[{name:'abc'}]
      };
      expectedDataObj1 = {
        name:'team1',
        seasons:[{
          name:'abc',
          players: [
            {'id': 1, 'name': 'Alice Alison'}
          ]
        }]
      };
      expectedDataObj2 = {
        name:'team1',
        seasons:[{
          name:'abc',
          players: [
            {'id': 1, 'name': 'Alice Alison'},
            {'id': 2, 'name': 'Bob Roberts'}
          ]
        }]
      };
      addFirstSquad.init({});
      addFirstSquad.internal.dataObj = startingDataObj;
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = '';
        addFirstSquad.internal.playerAddOnClick();
      });

      it('disables the button', () => {
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = 'Alice Alison';
        addFirstSquad.internal.playerAddOnClick();
      });

      it('enables the button', () => {
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', undefined, expectedDataObj1);
      });

      it('adds players to the list', () => {
        addFirstSquad.internal.playerName.value = 'Bob Roberts';
        addFirstSquad.internal.playerAddOnClick();
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', undefined, expectedDataObj2);
      });
    });
  });

  describe('#playerNameOnInput', () => {
    beforeEach(() => {
      addFirstSquad.init({});
      addFirstSquad.internal.playerAddButton.className = 'null';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = '';
        addFirstSquad.internal.playerName.oninput();
      });

      it('sets the button class to disabled', () => {
        expect(addFirstSquad.internal.playerAddButton.className).to.equal('button new-item-button-disabled');
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstSquad.internal.playerName.value = 'abc';
        addFirstSquad.internal.playerName.oninput();
      });

      it('sets the button class to enabled', () => {
        expect(addFirstSquad.internal.playerAddButton.className).to.equal('button new-item-button');
      });
    });
  });

  describe('#doneOnClick', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      addFirstSquad.init(stateManagerStub);
    });

    context('if the page is complete', () => {
      beforeEach(() => {
        addFirstSquad.internal.pageComplete = true;
      });

      it('calls to change state from add-first-squad to add-first-match', () => {
        addFirstSquad.internal.doneOnClick();
        expect(showStateStub).to.be.calledWith('add-first-squad', 'add-first-match');
      });
    });

    context('if the page is not complete', () => {
      beforeEach(() => {
        addFirstSquad.internal.pageComplete = false;
      });

      it('does not change the state', () => {
        addFirstSquad.internal.doneOnClick();
        expect(showStateStub).to.not.be.called;
      });
    });
  });

  describe('#teamSaveListener', () => {
    beforeEach(() => {
      addFirstSquad.init({});
    });

    it('calls to load the team data', () => {
      addFirstSquad.internal.teamSaveListener();
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#teamGetListener', () => {
    let dataObj = {
      name: 'team1',
      seasons: [
        {
          name: 'season1',
          players: [
            {id: 1, name: 'Alice Alison'},
          ]
        }
      ]
    };
    let stateManagerStub;

    beforeEach(() => {
      stateManagerStub = {};
      addFirstSquad.internal.dataObj = {};
      addFirstSquad.init(stateManagerStub);
    });

    it('locally stores the team data', () => {
      addFirstSquad.internal.teamGetListener(undefined, undefined, dataObj);
      expect(addFirstSquad.internal.dataObj).to.deep.equal(dataObj);
    });

    it('clears the curent playerName input and add button', () => {
      addFirstSquad.internal.playerName.value = 'sometext';
      addFirstSquad.internal.teamGetListener(undefined, undefined, dataObj);
      expect(addFirstSquad.internal.playerName.value).to.equal('');
      expect(addFirstSquad.internal.playerAddButton.className).to.equal('button new-item-button-disabled');
    });

    context('when 5 players exist', () => {
      let fivePlayers = {
        name: 'team1',
        seasons: [
          {
            name: 'season1',
            players: [
              {id: 1, name: 'Alice Alison'},
              {id: 2, name: 'Bob Roberts'},
              {id: 3, name: 'Charlie Charlson'},
              {id: 4, name: 'Debbie Davis'},
              {id: 5, name: 'Emma Emerton'},
            ]
          }
        ]
      };

      beforeEach(() => {
        addFirstSquad.internal.teamGetListener(undefined, undefined, fivePlayers);
      });

      it('adds the players to the list', () => {
        expect(addFirstSquad.internal.playerList.childNodes.length).to.equal(5);
      });

      it('does not enable the bone button', () => {
        expect(addFirstSquad.internal.pageComplete).to.equal(false);
        expect(addFirstSquad.internal.doneButton.className).to.equal('button done-button-disabled');
      });
    });

    context('when 6 players exist', () => {
      let sixPlayers = {
        name: 'team1',
        seasons: [
          {
            name: 'season1',
            players: [
              {id: 1, name: 'Alice Alison'},
              {id: 2, name: 'Bob Roberts'},
              {id: 3, name: 'Charlie Charlson'},
              {id: 4, name: 'Debbie Davis'},
              {id: 5, name: 'Emma Emerton'},
              {id: 6, name: 'Freda Ferguson'},
            ]
          }
        ]
      };

      beforeEach(() => {
        addFirstSquad.internal.teamGetListener(undefined, undefined, sixPlayers);
      });

      it('enables the done button', () => {
        expect(addFirstSquad.internal.pageComplete).to.equal(true);
        expect(addFirstSquad.internal.doneButton.className).to.equal('button done-button');
      });
    });
  });

});