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

describe('app/js/add-first-match', () => {
  let jsdomCleanup;

  let addFirstMatch;

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
    addFirstMatch = proxyquire('../../../../app/js/states/add-first-match.js',
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

    addFirstMatch.internal.stateManager = undefined;
    addFirstMatch.internal.matchAddButton = undefined;
    addFirstMatch.internal.matchDate = undefined;
    addFirstMatch.internal.matchOpponent = undefined;
    addFirstMatch.internal.breadcrumb = undefined;
    addFirstMatch.internal.filename = undefined;
    addFirstMatch.internal.dataObj = undefined;
    addFirstMatch.internal.seasonId = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof addFirstMatch.name).to.equal('string');
    expect(typeof addFirstMatch.state).to.equal('object');
    expect(typeof addFirstMatch.attach).to.equal('function');
    expect(typeof addFirstMatch.detach).to.equal('function');
    expect(typeof addFirstMatch.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for return-team-data', () => {
      addFirstMatch.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', addFirstMatch.internal.returnTeamDataListener);
    });

    it('registers for team-data-saved', () => {
      addFirstMatch.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', addFirstMatch.internal.teamDataSavedListener);
    });

    it('registers for team-match-stored', () => {
      addFirstMatch.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-match-stored', addFirstMatch.internal.teamMatchStoredListener);
    });

    it('sends a get-team-data event', () => {
      addFirstMatch.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#detach', () => {
    it('deregisters for return-team-data', () => {
      addFirstMatch.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', addFirstMatch.internal.returnTeamDataListener);
    });

    it('deregisters for team-data-saved', () => {
      addFirstMatch.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', addFirstMatch.internal.teamDataSavedListener);
    });

    it('deregisters for team-match-stored', () => {
      addFirstMatch.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-match-stored', addFirstMatch.internal.teamMatchStoredListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {addFirstMatch.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        addFirstMatch.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(addFirstMatch.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the matchAdd button', () => {
        expect(addFirstMatch.internal.matchAddButton).to.equal(document.getElementById('button_add-first-match_add'));
      });

      it('finds the matchDate textbox', () => {
        expect(addFirstMatch.internal.matchDate).to.equal(document.getElementById('input_add-first-match_date'));
      });

      it('finds the matchOpponent textbox', () => {
        expect(addFirstMatch.internal.matchOpponent).to.equal(document.getElementById('input_add-first-match_opponent'));
      });

      it('finds the breadcrumb div', () => {
        expect(addFirstMatch.internal.breadcrumb).to.equal(document.getElementById('add-first-match_breadcrumbs'));
      });

      it('sets the matchAdd onclick listener for the button', () => {
        expect(addFirstMatch.internal.matchAddButton.onclick).to.equal(addFirstMatch.internal.matchAddOnClick);
      });

      it('sets the oninput listener for the matchDate input', () => {
        expect(addFirstMatch.internal.matchDate.oninput).to.equal(addFirstMatch.internal.matchDateOnInput);
      });

      it('sets the oninput listener for the matchOpponent input', () => {
        expect(addFirstMatch.internal.matchOpponent.oninput).to.equal(addFirstMatch.internal.matchOpponentOnInput);
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
            name:'season1',
            players: [
              {id: 1, name: 'Alice Alison'},
              {id: 2, name: 'Bob Roberts'},
              {id: 3, name: 'Charlie Charlson'},
              {id: 4, name: 'Debbie Davis'},
              {id: 5, name: 'Emma Emerton'},
              {id: 6, name: 'Freda Ferguson'}
            ]
          }
        ]
      };
      addFirstMatch.internal.dataObj = dataObj;
      addFirstMatch.internal.seasonId = 0;
      addFirstMatch.init(stateManagerStub);
      addFirstMatch.internal.generateBreadcrumb();
      breadcrumbParts = document.getElementById('add-first-match_breadcrumbs').childNodes;
    });

    it('generates a breadcrumb', () => {
      expect(breadcrumbParts[0].innerHTML).to.equal('Home');
      expect(breadcrumbParts[2].innerHTML).to.equal(dataObj.name);
      expect(breadcrumbParts[4].innerHTML).to.equal(dataObj.seasons[0].name);
    });

    it('cleans out the old breadcrumb on each call', () => {
      addFirstMatch.internal.generateBreadcrumb();
      addFirstMatch.internal.generateBreadcrumb();
      expect(breadcrumbParts.length).to.equal(5);
    });

    it('makes the home button show "pick-a-team"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function');
      breadcrumbParts[0].onclick();
      expect(showStateStub).to.be.calledWith('add-first-match', 'pick-a-team');
    });

    it('makes the team button show "pick-a-season"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function');
      breadcrumbParts[2].onclick();
      expect(showStateStub).to.be.calledWith('add-first-match', 'pick-a-season');
    });
  });

  describe('#matchAddOnClick', () => {
    let startingDataObj;
    let expectedDataObj;

    beforeEach(() => {
      startingDataObj = {
        name:'team1',
        seasons:[
          {
            name:'xyz'
          },{
            name:'abc',
            players: [
              {id: 1, name: 'Alice Alison'},
              {id: 2, name: 'Bob Roberts'},
              {id: 3, name: 'Charlie Charlson'},
              {id: 4, name: 'Debbie Davis'},
              {id: 5, name: 'Emma Emerton'},
              {id: 6, name: 'Freda Ferguson'}
            ]
          }
        ]
      };
      expectedDataObj = {
        name:'team1',
        seasons:[
          {
            name:'xyz'
          },{
            name:'abc',
            players: [
              {id: 1, name: 'Alice Alison'},
              {id: 2, name: 'Bob Roberts'},
              {id: 3, name: 'Charlie Charlson'},
              {id: 4, name: 'Debbie Davis'},
              {id: 5, name: 'Emma Emerton'},
              {id: 6, name: 'Freda Ferguson'}
            ],
            matches: [
              {
                date: '2017-10-20',
                opponent: {
                  name: 'Newtown City'
                }
              }
            ]
          }
        ]
      };
      addFirstMatch.init({});
      addFirstMatch.internal.filename = 'someFileName';
      addFirstMatch.internal.seasonId = 1;
      addFirstMatch.internal.dataObj = startingDataObj;
    });

    context('when the date is not set', () => {
      beforeEach(() => {
        addFirstMatch.internal.matchDate.value = '';
      });

      context('when the opponent name is zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = '';
          addFirstMatch.internal.matchAddOnClick();
        });

        it('disables the button', () => {
          expect(ipcRendererSendStub).to.not.be.called;
        });
      });

      context('when the opponent name is longer than zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = 'abc';
          addFirstMatch.internal.matchAddOnClick();
        });

        it('disables the button', () => {
          expect(ipcRendererSendStub).to.not.be.called;
        });
      });
    });

    context('when the date is set', () => {
      beforeEach(() => {
        addFirstMatch.internal.matchDate.value = '2017-10-20';
      });

      context('when the opponent name is zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = '';
          addFirstMatch.internal.matchAddOnClick();
        });

        it('disables the button', () => {
          expect(ipcRendererSendStub).to.not.be.called;
        });
      });

      context('when input is longer than zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = 'Newtown City';
          addFirstMatch.internal.matchAddOnClick();
        });

        it('enables the button', () => {
          expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFileName', expectedDataObj);
        });
      });
    });

    context('when the opponent name is zero length', () => {
      beforeEach(() => {
        addFirstMatch.internal.matchDate.value = '';
        addFirstMatch.internal.matchAddOnClick();
      });

      it('disables the button', () => {
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });


  });

  describe('#matchDateOnInput', () => {
    beforeEach(() => {
      addFirstMatch.init({});
      addFirstMatch.internal.matchAddButton.className = 'null';
    });

    context('when the opponent is zero length', () => {
      beforeEach(() => {
        addFirstMatch.internal.matchOpponent.value = '';
      });

      context('when date is not set', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchDate.value = '';
          addFirstMatch.internal.matchDate.oninput();
        });

        it('sets the button class to disabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });

      context('when date is set', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchDate.value = '2017-02-03';
          addFirstMatch.internal.matchDate.oninput();
        });

        it('sets the button class to disabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });
    });

    context('when the opponent is longet than zero length', () => {
      beforeEach(() => {
        addFirstMatch.internal.matchOpponent.value = 'abc';
      });

      context('when date is not set', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchDate.value = '';
          addFirstMatch.internal.matchDate.oninput();
        });

        it('sets the button class to disabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });

      context('when date is set', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchDate.value = '2017-02-03';
          addFirstMatch.internal.matchDate.oninput();
        });

        it('sets the button class to enabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button');
        });
      });
    });
  });

  describe('#matchOpponentOnInput', () => {
    beforeEach(() => {
      addFirstMatch.init({});
      addFirstMatch.internal.matchAddButton.className = 'null';
    });

    context('when the date is not set', () => {
      beforeEach(() => {
        addFirstMatch.internal.matchDate.value = '';
      });

      context('when opponent input is zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = '';
          addFirstMatch.internal.matchOpponent.oninput();
        });

        it('sets the button class to disabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });

      context('when opponent input is longer than zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = 'abc';
          addFirstMatch.internal.matchOpponent.oninput();
        });

        it('sets the button class to disabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });
    });

    context('when the date is set', () => {
      beforeEach(() => {
        addFirstMatch.internal.matchDate.value = '2017-01-02';
      });

      context('when opponent input is zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = '';
          addFirstMatch.internal.matchOpponent.oninput();
        });

        it('sets the button class to disabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });

      context('when opponent input is longer than zero length', () => {
        beforeEach(() => {
          addFirstMatch.internal.matchOpponent.value = 'abc';
          addFirstMatch.internal.matchOpponent.oninput();
        });

        it('sets the button class to enabled', () => {
          expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button');
        });
      });
    });
  });

  describe('#teamDataSavedListener', () => {
    beforeEach(() => {
      addFirstMatch.init({});
    });

    it('calls to store the match id', () => {
      addFirstMatch.internal.teamDataSavedListener();
      expect(ipcRendererSendStub).to.be.calledWith('store-team-match', 0);
    });
  });

  describe('#returnTeamDataListener', () => {
    let dataObj = {
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
    let stateManagerStub;
    let generateBreadcrumbStub;

    beforeEach(() => {
      stateManagerStub = {};
      addFirstMatch.internal.dataObj = {};
      addFirstMatch.internal.filename = 'foo';
      addFirstMatch.internal.seasonId = 0;
      generateBreadcrumbStub = sinon.stub(addFirstMatch.internal, 'generateBreadcrumb');
      addFirstMatch.init(stateManagerStub);
    });

    afterEach(() => {
      generateBreadcrumbStub.restore();
    });

    it('locally stores the team data', () => {
      addFirstMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(addFirstMatch.internal.dataObj).to.deep.equal(dataObj);
    });

    it('locally stores the filename', () => {
      addFirstMatch.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 0);
      expect(addFirstMatch.internal.filename).to.equal('someFileName');
    });

    it('locally stores the seasonId', () => {
      addFirstMatch.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 2);
      expect(addFirstMatch.internal.seasonId).to.equal(2);
    });

    it('clears the curent matchDate, matchOpponent and add button', () => {
      addFirstMatch.internal.matchDate.value = '2017-01-01';
      addFirstMatch.internal.matchOpponent.value = 'sometext';
      addFirstMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(addFirstMatch.internal.matchDate.value).to.equal('');
      expect(addFirstMatch.internal.matchOpponent.value).to.equal('');
      expect(addFirstMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
    });

    it('calls to generate the breadcrumb', () => {
      addFirstMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(generateBreadcrumbStub).to.be.calledOnce;
    });

  });

  describe('#teamMatchStoreListener', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      addFirstMatch.init(stateManagerStub);
    });

    it('calls to change state from add-first-match to match-editor', () => {
      addFirstMatch.internal.teamMatchStoredListener();
      expect(showStateStub).to.be.calledWith('add-first-match', 'match-editor');
    });
  });
});
