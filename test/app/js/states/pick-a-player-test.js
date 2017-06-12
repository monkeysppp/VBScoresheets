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

describe('app/js/pick-a-player', () => {
  let jsdomCleanup;

  let pickAPlayer;

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
    pickAPlayer = proxyquire('../../../../app/js/states/pick-a-player.js',
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

    pickAPlayer.internal.stateManager = undefined;
    pickAPlayer.internal.playerAddButton = undefined;
    pickAPlayer.internal.playerName = undefined;
    pickAPlayer.internal.playerList = undefined;
    pickAPlayer.internal.breadcrumb = undefined;
    pickAPlayer.internal.filename = undefined;
    pickAPlayer.internal.dataObj = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof pickAPlayer.name).to.equal('string');
    expect(typeof pickAPlayer.state).to.equal('object');
    expect(typeof pickAPlayer.attach).to.equal('function');
    expect(typeof pickAPlayer.detach).to.equal('function');
    expect(typeof pickAPlayer.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for team-data-saved', () => {
      pickAPlayer.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', pickAPlayer.internal.teamDataSavedListener);
    });

    it('registers for return-team-data', () => {
      pickAPlayer.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', pickAPlayer.internal.returnTeamDataListener);
    });

    it('registers for team-player-stored', () => {
      pickAPlayer.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-player-stored', pickAPlayer.internal.teamPlayerStoredListener);
    });

    it('sends a get-team-data event', () => {
      pickAPlayer.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#detach', () => {
    it('deregisters for team-data-saved', () => {
      pickAPlayer.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', pickAPlayer.internal.teamDataSavedListener);
    });

    it('deregisters for return-team-data', () => {
      pickAPlayer.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', pickAPlayer.internal.returnTeamDataListener);
    });

    it('deregisters for team-player-stored', () => {
      pickAPlayer.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-player-stored', pickAPlayer.internal.teamPlayerStoredListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {pickAPlayer.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        pickAPlayer.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(pickAPlayer.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the playerAdd button', () => {
        expect(pickAPlayer.internal.playerAddButton).to.equal(document.getElementById('button_pick-a-player_add'));
      });

      it('finds the playerName textbox', () => {
        expect(pickAPlayer.internal.playerName).to.equal(document.getElementById('input_pick-a-player'));
      });

      it('finds the playerList div', () => {
        expect(pickAPlayer.internal.playerList).to.equal(document.getElementById('pick-a-player_list'));
      });

      it('finds the breadcrumb div', () => {
        expect(pickAPlayer.internal.breadcrumb).to.equal(document.getElementById('pick-a-player_breadcrumbs'));
      });

      it('sets the playerAdd onclick listener for the button', () => {
        expect(pickAPlayer.internal.playerAddButton.onclick).to.equal(pickAPlayer.internal.playerAddOnClick);
      });

      it('sets the oninput listener for the input', () => {
        expect(pickAPlayer.internal.playerName.oninput).to.equal(pickAPlayer.internal.playerNameOnInput);
      });
    });
  });

  describe('#generateBreadcrumb', () => {
    let stateManagerStub;
    let showStateStub;
    let dataObj;
    let breadcrumbParts;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      dataObj = {
        name: 'team1',
        seasons: [
          {
            name: '2010/2011',
            players: [
              {id: 1, name: 'Alice Alison'},
              {id: 2, name: 'Bob Roberts'},
              {id: 3, name: 'Charlie Charlson'},
              {id: 4, name: 'Debbie Davis'},
              {id: 5, name: 'Emma Emerton'},
              {id: 6, name: 'Freda Ferguson'},
            ]
          },
          {
            name: '2011/2012'
          }
        ]
      };
      pickAPlayer.internal.dataObj = dataObj;
      pickAPlayer.internal.seasonId = 0;
      pickAPlayer.init(stateManagerStub);
      pickAPlayer.internal.generateBreadcrumb();
      breadcrumbParts = document.getElementById('pick-a-player_breadcrumbs').childNodes;
    });

    it('generates a breadcrumb', () => {
      expect(breadcrumbParts[0].innerHTML).to.equal('Home');
      expect(breadcrumbParts[2].innerHTML).to.equal(dataObj.name);
      expect(breadcrumbParts[4].innerHTML).to.equal(dataObj.seasons[0].name);
      expect(breadcrumbParts[6].innerHTML).to.equal('Players');
    });

    it('cleans out the old breadcrumb on each call', () => {
      pickAPlayer.internal.generateBreadcrumb();
      pickAPlayer.internal.generateBreadcrumb();
      expect(breadcrumbParts.length).to.equal(7);
    });

    it('makes the home button show "pick-a-team"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function');
      breadcrumbParts[0].onclick();
      expect(showStateStub).to.be.calledWith('pick-a-player', 'pick-a-team');
    });

    it('makes the team button show "pick-a-season"', () => {
      expect(typeof breadcrumbParts[2].onclick).to.equal('function');
      breadcrumbParts[2].onclick();
      expect(showStateStub).to.be.calledWith('pick-a-player', 'pick-a-season');
    });

    it('makes the season button show "main-branch"', () => {
      expect(typeof breadcrumbParts[4].onclick).to.equal('function');
      breadcrumbParts[4].onclick();
      expect(showStateStub).to.be.calledWith('pick-a-player', 'main-branch');
    });
  });

  describe('#playerAddOnClick', () => {
    let startingDataObj;
    let expectedDataObj;

    beforeEach(() => {
      startingDataObj = {
        name: 'team1',
        seasons: [
          {
            name: '2010/2011',
            players: [
              {id: 1, name: 'abc'}
            ]
          }
        ]
      };
      expectedDataObj = {
        name: 'team1',
        seasons: [
          {
            name: '2010/2011',
            players: [
              {id: 1, name: 'abc'},
              {id: 2, name: 'xyz'}
            ]
          }
        ]
      };
      pickAPlayer.init({});
      pickAPlayer.internal.dataObj = startingDataObj;
      pickAPlayer.internal.filename = 'someFileName';
      pickAPlayer.internal.seasonId = 0;
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        pickAPlayer.internal.playerName.value = '';
        pickAPlayer.internal.playerAddOnClick();
      });

      it('disables the button', () => {
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        pickAPlayer.internal.playerName.value = 'xyz';
        pickAPlayer.internal.playerAddOnClick();
      });

      it('adds the player to the team data', () => {
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFileName', expectedDataObj);
      });
    });
  });

  describe('#playerNameOnInput', () => {
    beforeEach(() => {
      pickAPlayer.init({});
      pickAPlayer.internal.playerAddButton.className = 'null';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        pickAPlayer.internal.playerName.value = '';
        pickAPlayer.internal.playerNameOnInput();
      });

      it('sets the button class to disabled', () => {
        expect(pickAPlayer.internal.playerAddButton.className).to.equal('button new-item-button-disabled');
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        pickAPlayer.internal.playerName.value = 'abc';
        pickAPlayer.internal.playerNameOnInput();
      });

      it('sets the button class to enabled', () => {
        expect(pickAPlayer.internal.playerAddButton.className).to.equal('button new-item-button');
      });
    });
  });

  describe('#returnTeamDataListener', () => {
    let stateManagerStub;
    let showStateStub;
    let generateBreadcrumbStub;
    let dataObj = {
      name: 'team1',
      seasons: [
        {
          name: '2011/2012'
        },
        {
          name: '2010/2011',
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
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      generateBreadcrumbStub = sinon.stub(pickAPlayer.internal, 'generateBreadcrumb');
      pickAPlayer.init(stateManagerStub);
      pickAPlayer.internal.dataObj = {};
      pickAPlayer.internal.filename = 'foo';
      pickAPlayer.internal.seasonId = 0;
    });

    afterEach(() => {
      generateBreadcrumbStub.restore();
    });

    it('locally stores the filename', () => {
      pickAPlayer.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 0);
      expect(pickAPlayer.internal.filename).to.equal('someFileName');
    });

    it('locally stores the team data', () => {
      pickAPlayer.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(pickAPlayer.internal.dataObj).to.deep.equal(dataObj);
    });

    it('locally stores the seasonId', () => {
      pickAPlayer.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1);
      expect(pickAPlayer.internal.seasonId).to.equal(1);
    });

    it('clears the curent playerName input and add button', () => {
      pickAPlayer.internal.playerName.value = 'sometext';
      pickAPlayer.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(pickAPlayer.internal.playerName.value).to.equal('');
      expect(pickAPlayer.internal.playerAddButton.className).to.equal('button new-item-button-disabled');
    });

    it('calls to generate the breadcrumb', () => {
      pickAPlayer.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(generateBreadcrumbStub).to.be.calledOnce;
    });

    context('the list items', () => {
      it('have an onclick that stored the player id', () => {
        pickAPlayer.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);

        let listItems = pickAPlayer.internal.playerList.getElementsByClassName('list-item');

        expect(listItems[0].innerHTML).to.equal(dataObj.seasons[1].players[0].name);
        expect(typeof listItems[0].onclick).to.equal('function');
        listItems[0].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-player', 1);

        expect(listItems[1].innerHTML).to.equal(dataObj.seasons[1].players[1].name);
        expect(typeof listItems[1].onclick).to.equal('function');
        listItems[1].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-player', 2);

        expect(listItems[2].innerHTML).to.equal(dataObj.seasons[1].players[2].name);
        expect(typeof listItems[2].onclick).to.equal('function');
        listItems[2].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-player', 3);

        expect(listItems[3].innerHTML).to.equal(dataObj.seasons[1].players[3].name);
        expect(typeof listItems[3].onclick).to.equal('function');
        listItems[3].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-player', 4);

        expect(listItems[4].innerHTML).to.equal(dataObj.seasons[1].players[4].name);
        expect(typeof listItems[4].onclick).to.equal('function');
        listItems[4].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-player', 5);

        expect(listItems[5].innerHTML).to.equal(dataObj.seasons[1].players[5].name);
        expect(typeof listItems[5].onclick).to.equal('function');
        listItems[5].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-player', 6);
      });

      it('get cleaned out on each load call', () => {
        pickAPlayer.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);
        pickAPlayer.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);
        pickAPlayer.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);

        let listItems = pickAPlayer.internal.playerList.getElementsByClassName('list-item');
        expect(pickAPlayer.internal.playerList.childNodes.length).to.equal(6);
        expect(listItems[0].innerHTML).to.equal('Alice Alison');
        expect(listItems[1].innerHTML).to.equal('Bob Roberts');
        expect(listItems[2].innerHTML).to.equal('Charlie Charlson');
        expect(listItems[3].innerHTML).to.equal('Debbie Davis');
        expect(listItems[4].innerHTML).to.equal('Emma Emerton');
        expect(listItems[5].innerHTML).to.equal('Freda Ferguson');
      });
    });
  });

  describe('#teamDataSavedListener', () => {
    beforeEach(() => {
      pickAPlayer.internal.dataObj = {
        name: 'team1',
        players: [
          {name: 'abc'},
          {name: 'xyz'},
          {name: '123/456'}
        ]
      };
    });

    it('calls to get the team data', () => {
      pickAPlayer.internal.teamDataSavedListener();
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#teamPlayerStoredListener', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      pickAPlayer.init(stateManagerStub);
    });

    it('shows player-stats', () => {
      pickAPlayer.internal.teamPlayerStoredListener();
      expect(showStateStub).to.be.calledWith('pick-a-player', 'player-stats');
    });
  });
});
