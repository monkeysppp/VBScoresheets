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

describe('app/js/pick-a-season', () => {
  let jsdomCleanup;

  let pickASeason;

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
    pickASeason = proxyquire('../../../../app/js/states/pick-a-season.js',
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

    pickASeason.internal.stateManager = undefined;
    pickASeason.internal.seasonAddButton = undefined;
    pickASeason.internal.seasonName = undefined;
    pickASeason.internal.seasonList = undefined;
    pickASeason.internal.breadcrumb = undefined;
    pickASeason.internal.filename = undefined;
    pickASeason.internal.dataObj = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof pickASeason.name).to.equal('string');
    expect(typeof pickASeason.state).to.equal('object');
    expect(typeof pickASeason.attach).to.equal('function');
    expect(typeof pickASeason.detach).to.equal('function');
    expect(typeof pickASeason.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for team-data-saved', () => {
      pickASeason.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', pickASeason.internal.teamDataSavedListener);
    });

    it('registers for return-team-data', () => {
      pickASeason.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', pickASeason.internal.returnTeamDataListener);
    });

    it('registers for team-season-stored', () => {
      pickASeason.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-season-stored', pickASeason.internal.teamSeasonStoredListener);
    });

    it('sends a get-team-data event', () => {
      pickASeason.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#detach', () => {
    it('deregisters for team-data-saved', () => {
      pickASeason.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', pickASeason.internal.teamDataSavedListener);
    });

    it('deregisters for return-team-data', () => {
      pickASeason.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', pickASeason.internal.returnTeamDataListener);
    });

    it('deregisters for team-season-stored', () => {
      pickASeason.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-season-stored', pickASeason.internal.teamSeasonStoredListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {pickASeason.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        pickASeason.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(pickASeason.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the seasonAdd button', () => {
        expect(pickASeason.internal.seasonAddButton).to.equal(document.getElementById('button_pick-a-season_add'));
      });

      it('finds the seasonName textbox', () => {
        expect(pickASeason.internal.seasonName).to.equal(document.getElementById('input_pick-a-season'));
      });

      it('finds the seasonList div', () => {
        expect(pickASeason.internal.seasonList).to.equal(document.getElementById('pick-a-season_list'));
      });

      it('finds the breadcrumb div', () => {
        expect(pickASeason.internal.breadcrumb).to.equal(document.getElementById('pick-a-season_breadcrumbs'));
      });

      it('sets the seasonAdd onclick listener for the button', () => {
        expect(pickASeason.internal.seasonAddButton.onclick).to.equal(pickASeason.internal.seasonAddOnClick);
      });

      it('sets the oninput listener for the input', () => {
        expect(pickASeason.internal.seasonName.oninput).to.equal(pickASeason.internal.seasonNameOnInput);
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
          {name: 'season1'},
          {name: 'season2'},
          {name: 'season3'}
        ]
      };
      pickASeason.internal.dataObj = dataObj;
      pickASeason.init(stateManagerStub);
      pickASeason.internal.generateBreadcrumb();
      breadcrumbParts = document.getElementById('pick-a-season_breadcrumbs').childNodes;
    });

    it('generates a breadcrumb', () => {
      expect(breadcrumbParts[0].innerHTML).to.equal('Home');
      expect(breadcrumbParts[2].innerHTML).to.equal(dataObj.name);
    });

    it('cleans out the old breadcrumb on each call', () => {
      pickASeason.internal.generateBreadcrumb();
      pickASeason.internal.generateBreadcrumb();
      expect(breadcrumbParts.length).to.equal(3);
    });

    it('makes the home button show "pick-a-team"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function');
      breadcrumbParts[0].onclick();
      expect(showStateStub).to.be.calledWith('pick-a-season', 'pick-a-team');
    });
  });

  describe('#seasonAddOnClick', () => {
    let startingDataObj;
    let expectedDataObj;

    beforeEach(() => {
      startingDataObj = {
        name: 'team1',
        seasons: [
          {name: 'abc'}
        ]
      };
      expectedDataObj = {
        name: 'team1',
        seasons: [
          {name: 'abc'},
          {name: 'xyz'}
        ]
      };
      pickASeason.init({});
      pickASeason.internal.dataObj = startingDataObj;
      pickASeason.internal.filename = 'someFileName';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        pickASeason.internal.seasonName.value = '';
        pickASeason.internal.seasonAddOnClick();
      });

      it('disables the button', () => {
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        pickASeason.internal.seasonName.value = 'xyz';
        pickASeason.internal.seasonAddOnClick();
      });

      it('adds the season to the team data', () => {
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFileName', expectedDataObj);
      });
    });
  });

  describe('#seasonNameOnInput', () => {
    beforeEach(() => {
      pickASeason.init({});
      pickASeason.internal.seasonAddButton.className = 'null';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        pickASeason.internal.seasonName.value = '';
        pickASeason.internal.seasonNameOnInput();
      });

      it('sets the button class to disabled', () => {
        expect(pickASeason.internal.seasonAddButton.className).to.equal('button new-item-button-disabled');
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        pickASeason.internal.seasonName.value = 'abc';
        pickASeason.internal.seasonNameOnInput();
      });

      it('sets the button class to enabled', () => {
        expect(pickASeason.internal.seasonAddButton.className).to.equal('button new-item-button');
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
        {name: 'season1'},
        {name: 'season2'},
        {name: 'season3'}
      ]
    };

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      generateBreadcrumbStub = sinon.stub(pickASeason.internal, 'generateBreadcrumb');
      pickASeason.init(stateManagerStub);
      pickASeason.internal.dataObj = {};
    });

    afterEach(() => {
      generateBreadcrumbStub.restore();
    });

    it('locally stores the filename', () => {
      pickASeason.internal.returnTeamDataListener(undefined, 'someFileName', dataObj);
      expect(pickASeason.internal.filename).to.equal('someFileName');
    });

    it('locally stores the team data', () => {
      pickASeason.internal.returnTeamDataListener(undefined, undefined, dataObj);
      expect(pickASeason.internal.dataObj).to.deep.equal(dataObj);
    });

    it('clears the curent seasonName input and add button', () => {
      pickASeason.internal.seasonName.value = 'sometext';
      pickASeason.internal.returnTeamDataListener(undefined, undefined, dataObj);
      expect(pickASeason.internal.seasonName.value).to.equal('');
      expect(pickASeason.internal.seasonAddButton.className).to.equal('button new-item-button-disabled');
    });

    it('calls to generate the breadcrumb', () => {
      pickASeason.internal.returnTeamDataListener(undefined, undefined, dataObj);
      expect(generateBreadcrumbStub).to.be.calledOnce;
    });

    context('the list items', () => {
      it('have an onclick that loads the team file', () => {
        pickASeason.internal.returnTeamDataListener(undefined, undefined, dataObj);

        let listItems = pickASeason.internal.seasonList.getElementsByClassName('list-item');

        expect(listItems[0].innerHTML).to.equal('season1');
        expect(typeof listItems[0].onclick).to.equal('function');
        listItems[0].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-season', 0);

        expect(listItems[1].innerHTML).to.equal('season2');
        expect(typeof listItems[1].onclick).to.equal('function');
        listItems[1].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-season', 1);

        expect(listItems[2].innerHTML).to.equal('season3');
        expect(typeof listItems[2].onclick).to.equal('function');
        listItems[2].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-season', 2);
      });

      it('get cleaned out on each load call', () => {
        pickASeason.internal.returnTeamDataListener(undefined, undefined, dataObj);
        pickASeason.internal.returnTeamDataListener(undefined, undefined, dataObj);
        pickASeason.internal.returnTeamDataListener(undefined, undefined, dataObj);

        let listItems = pickASeason.internal.seasonList.getElementsByClassName('list-item');
        expect(pickASeason.internal.seasonList.childNodes.length).to.equal(3);
        expect(listItems[0].innerHTML).to.equal('season1');
        expect(listItems[1].innerHTML).to.equal('season2');
        expect(listItems[2].innerHTML).to.equal('season3');
      });
    });
  });

  describe('#teamDataSavedListener', () => {
    beforeEach(() => {
      pickASeason.internal.dataObj = {
        name: 'team1',
        seasons: [
          {name: 'abc'},
          {name: 'xyz'},
          {name: '123/456'}
        ]
      };
    });

    it('calls to store the newly created season', () => {
      pickASeason.internal.teamDataSavedListener();
      expect(ipcRendererSendStub).to.be.calledWith('store-team-season', 2);
    });
  });

  describe('#teamSeasonStoredListener', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      pickASeason.init(stateManagerStub);
      pickASeason.internal.dataObj = {
        name: 'team1',
        seasons: [
          {
            name: 'abc'
          },
          {
            name: 'def',
            players: [
              {'id': 1, 'name': 'Alice Alison'},
              {'id': 2, 'name': 'Bob Roberts'}
            ]
          },
          {
            name: 'ghi',
            players: [
              {'id': 1, 'name': 'Alice Alison'},
              {'id': 2, 'name': 'Bob Roberts'},
              {'id': 3, 'name': 'Charlie Charlson'},
              {'id': 4, 'name': 'Debbie Davis'},
              {'id': 5, 'name': 'Emma Emerton'},
              {'id': 6, 'name': 'Freda Ferguson'}
            ]
          },
          {
            name: 'jkl',
            players: [
              {'id': 1, 'name': 'Alice Alison'},
              {'id': 2, 'name': 'Bob Roberts'},
              {'id': 3, 'name': 'Charlie Charlson'},
              {'id': 4, 'name': 'Debbie Davis'},
              {'id': 5, 'name': 'Emma Emerton'},
              {'id': 6, 'name': 'Freda Ferguson'}
            ],
            matches: [
              {venue:'some sports hall'}
            ]
          },
        ]
      };
    });

    context('when the selected season has no players', () => {
      it('shows add-first-squad', () => {
        pickASeason.internal.teamSeasonStoredListener(undefined, 0);
        expect(showStateStub).to.be.calledWith('pick-a-season', 'add-first-squad');
      });
    });

    context('when the selected season has less than 6 players', () => {
      it('shows add-first-squad', () => {
        pickASeason.internal.teamSeasonStoredListener(undefined, 1);
        expect(showStateStub).to.be.calledWith('pick-a-season', 'add-first-squad');
      });
    });

    context('when the selected season has 6 players', () => {
      context('but no matches defined', () => {
        it('shows add-first-match', () => {
          pickASeason.internal.teamSeasonStoredListener(undefined, 2);
          expect(showStateStub).to.be.calledWith('pick-a-season', 'add-first-match');
        });
      });

      context('and matches defined', () => {
        it('shows main-branch', () => {
          pickASeason.internal.teamSeasonStoredListener(undefined, 3);
          expect(showStateStub).to.be.calledWith('pick-a-season', 'main-branch');
        });
      });
    });
  });
});
