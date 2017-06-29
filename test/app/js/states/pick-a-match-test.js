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

describe('app/js/pick-a-match', () => {
  let jsdomCleanup;

  let pickAMatch;

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
    pickAMatch = proxyquire('../../../../app/js/states/pick-a-match.js',
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

    pickAMatch.internal.stateManager = undefined;
    pickAMatch.internal.matchAddButton = undefined;
    pickAMatch.internal.matchDate = undefined;
    pickAMatch.internal.matchOpponent = undefined;
    pickAMatch.internal.matchList = undefined;
    pickAMatch.internal.breadcrumb = undefined;
    pickAMatch.internal.filename = undefined;
    pickAMatch.internal.dataObj = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof pickAMatch.name).to.equal('string');
    expect(typeof pickAMatch.state).to.equal('object');
    expect(typeof pickAMatch.attach).to.equal('function');
    expect(typeof pickAMatch.detach).to.equal('function');
    expect(typeof pickAMatch.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for team-data-saved', () => {
      pickAMatch.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', pickAMatch.internal.teamDataSavedListener);
    });

    it('registers for return-team-data', () => {
      pickAMatch.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', pickAMatch.internal.returnTeamDataListener);
    });

    it('registers for team-match-stored', () => {
      pickAMatch.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-match-stored', pickAMatch.internal.teamMatchStoredListener);
    });

    it('sends a get-team-data event', () => {
      pickAMatch.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#detach', () => {
    it('deregisters for team-data-saved', () => {
      pickAMatch.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', pickAMatch.internal.teamDataSavedListener);
    });

    it('deregisters for return-team-data', () => {
      pickAMatch.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', pickAMatch.internal.returnTeamDataListener);
    });

    it('deregisters for team-match-stored', () => {
      pickAMatch.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-match-stored', pickAMatch.internal.teamMatchStoredListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {pickAMatch.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        pickAMatch.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(pickAMatch.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the matchAdd button', () => {
        expect(pickAMatch.internal.matchAddButton).to.equal(document.getElementById('button_pick-a-match_add'));
      });

      it('finds the matchDate textbox', () => {
        expect(pickAMatch.internal.matchDate).to.equal(document.getElementById('input_pick-a-match_date'));
      });

      it('finds the matchOpponent textbox', () => {
        expect(pickAMatch.internal.matchOpponent).to.equal(document.getElementById('input_pick-a-match_opponent'));
      });

      it('finds the matchList div', () => {
        expect(pickAMatch.internal.matchList).to.equal(document.getElementById('pick-a-match_list'));
      });

      it('finds the breadcrumb div', () => {
        expect(pickAMatch.internal.breadcrumb).to.equal(document.getElementById('pick-a-match_breadcrumbs'));
      });

      it('sets the matchAdd onclick listener for the button', () => {
        expect(pickAMatch.internal.matchAddButton.onclick).to.equal(pickAMatch.internal.matchAddOnClick);
      });

      it('sets the oninput listener for the date input', () => {
        expect(pickAMatch.internal.matchDate.oninput).to.equal(pickAMatch.internal.matchInputOnInput);
      });

      it('sets the oninput listener for the opponent input', () => {
        expect(pickAMatch.internal.matchOpponent.oninput).to.equal(pickAMatch.internal.matchInputOnInput);
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
            ],
            matches: [
              {
                id: 1,
                date: '2017-05-21',
                squads: {
                  opponent: {
                    name: 'Newtown City'
                  }
                }
              }
            ]
          },
          {
            name: '2011/2012'
          }
        ]
      };
      pickAMatch.internal.dataObj = dataObj;
      pickAMatch.internal.seasonId = 0;
      pickAMatch.init(stateManagerStub);
      pickAMatch.internal.generateBreadcrumb();
      breadcrumbParts = document.getElementById('pick-a-match_breadcrumbs').childNodes;
    });

    it('generates a breadcrumb', () => {
      expect(breadcrumbParts[0].innerHTML).to.equal('Home');
      expect(breadcrumbParts[2].innerHTML).to.equal(dataObj.name);
      expect(breadcrumbParts[4].innerHTML).to.equal(dataObj.seasons[0].name);
      expect(breadcrumbParts[6].innerHTML).to.equal('Matches');
    });

    it('cleans out the old breadcrumb on each call', () => {
      pickAMatch.internal.generateBreadcrumb();
      pickAMatch.internal.generateBreadcrumb();
      expect(breadcrumbParts.length).to.equal(7);
    });

    it('makes the home button show "pick-a-team"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function');
      breadcrumbParts[0].onclick();
      expect(showStateStub).to.be.calledWith('pick-a-match', 'pick-a-team');
    });

    it('makes the team button show "pick-a-season"', () => {
      expect(typeof breadcrumbParts[2].onclick).to.equal('function');
      breadcrumbParts[2].onclick();
      expect(showStateStub).to.be.calledWith('pick-a-match', 'pick-a-season');
    });

    it('makes the season button show "main-branch"', () => {
      expect(typeof breadcrumbParts[4].onclick).to.equal('function');
      breadcrumbParts[4].onclick();
      expect(showStateStub).to.be.calledWith('pick-a-match', 'main-branch');
    });
  });

  describe('#matchAddOnClick', () => {
    let startingDataObj;
    let expectedDataObj;

    beforeEach(() => {
      startingDataObj = {
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
            ],
            matches: [
              {
                id: 1,
                date: '2017-05-21',
                squads: {
                  opponent: {
                    name: 'Newtown City'
                  }
                }
              }
            ]
          },
          {
            name: '2011/2012'
          }
        ]
      };
      expectedDataObj = {
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
            ],
            matches: [
              {
                id: 1,
                date: '2017-05-21',
                squads: {
                  opponent: {
                    name: 'Newtown City'
                  }
                }
              },
              {
                id: 2,
                date: '2017-10-20',
                squads: {
                  opponent: {
                    name: 'New Town'
                  }
                }
              }
            ]
          },
          {
            name: '2011/2012'
          }
        ]
      };
      pickAMatch.init({});
      pickAMatch.internal.dataObj = startingDataObj;
      pickAMatch.internal.filename = 'someFileName';
      pickAMatch.internal.seasonId = 0;
    });

    context('when the date is not set', () => {
      beforeEach(() => {
        pickAMatch.internal.matchDate.value = '';
      });

      context('when the opponent name is zero length', () => {
        beforeEach(() => {
          pickAMatch.internal.matchOpponent.value = '';
          pickAMatch.internal.matchAddOnClick();
        });

        it('disables the button', () => {
          expect(ipcRendererSendStub).to.not.be.called;
        });
      });

      context('when the opponent name is longer than zero length', () => {
        beforeEach(() => {
          pickAMatch.internal.matchOpponent.value = 'abc';
          pickAMatch.internal.matchAddOnClick();
        });

        it('disables the button', () => {
          expect(ipcRendererSendStub).to.not.be.called;
        });
      });
    });

    context('when the date is set', () => {
      beforeEach(() => {
        pickAMatch.internal.matchDate.value = '2017-10-20';
      });

      context('when the opponent name is zero length', () => {
        beforeEach(() => {
          pickAMatch.internal.matchOpponent.value = '';
          pickAMatch.internal.matchAddOnClick();
        });

        it('disables the button', () => {
          expect(ipcRendererSendStub).to.not.be.called;
        });
      });

      context('when input is longer than zero length', () => {
        beforeEach(() => {
          pickAMatch.internal.matchOpponent.value = 'New Town';
          pickAMatch.internal.matchAddOnClick();
        });

        it('enables the button', () => {
          expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFileName', expectedDataObj);
        });
      });
    });
  });

  describe('#matchInputOnInput', () => {
    beforeEach(() => {
      pickAMatch.init({});
      pickAMatch.internal.matchAddButton.className = 'null';
    });

    context('when the opponent is zero length', () => {
      beforeEach(() => {
        pickAMatch.internal.matchOpponent.value = '';
      });

      context('when date is not set', () => {
        beforeEach(() => {
          pickAMatch.internal.matchDate.value = '';
          pickAMatch.internal.matchInputOnInput();
        });

        it('sets the button class to disabled', () => {
          expect(pickAMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });

      context('when date is set', () => {
        beforeEach(() => {
          pickAMatch.internal.matchDate.value = '2017-02-03';
          pickAMatch.internal.matchInputOnInput();
        });

        it('sets the button class to disabled', () => {
          expect(pickAMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });
    });

    context('when the opponent is longet than zero length', () => {
      beforeEach(() => {
        pickAMatch.internal.matchOpponent.value = 'abc';
      });

      context('when date is not set', () => {
        beforeEach(() => {
          pickAMatch.internal.matchDate.value = '';
          pickAMatch.internal.matchInputOnInput();
        });

        it('sets the button class to disabled', () => {
          expect(pickAMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
        });
      });

      context('when date is set', () => {
        beforeEach(() => {
          pickAMatch.internal.matchDate.value = '2017-02-03';
          pickAMatch.internal.matchInputOnInput();
        });

        it('sets the button class to enabled', () => {
          expect(pickAMatch.internal.matchAddButton.className).to.equal('button new-item-button');
        });
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
          ],
          matches: [
            {
              id: 2,
              date: '2017-05-21',
              squads: {
                opponent: {
                  name: 'Newtown City'
                }
              }
            },
            {
              id: 1,
              date: '2017-05-14',
              squads: {
                opponent: {
                  name: 'New Town'
                }
              }
            },
            {
              id: 3,
              date: '2017-05-28',
              squads: {
                opponent: {
                  name: 'New City'
                }
              }
            }
          ]
        }
      ]
    };

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      generateBreadcrumbStub = sinon.stub(pickAMatch.internal, 'generateBreadcrumb');
      pickAMatch.init(stateManagerStub);
      pickAMatch.internal.dataObj = {};
      pickAMatch.internal.filename = 'foo';
      pickAMatch.internal.seasonId = 0;
    });

    afterEach(() => {
      generateBreadcrumbStub.restore();
    });

    it('locally stores the filename', () => {
      pickAMatch.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 0);
      expect(pickAMatch.internal.filename).to.equal('someFileName');
    });

    it('locally stores the team data', () => {
      pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(pickAMatch.internal.dataObj).to.deep.equal(dataObj);
    });

    it('locally stores the seasonId', () => {
      pickAMatch.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1);
      expect(pickAMatch.internal.seasonId).to.equal(1);
    });

    it('clears the curent matchDate, matchOpponent and add button', () => {
      pickAMatch.internal.matchDate.value = 'sometext';
      pickAMatch.internal.matchOpponent.value = 'sometext';
      pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(pickAMatch.internal.matchDate.value).to.equal('');
      expect(pickAMatch.internal.matchOpponent.value).to.equal('');
      expect(pickAMatch.internal.matchAddButton.className).to.equal('button new-item-button-disabled');
    });

    it('calls to generate the breadcrumb', () => {
      pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 0);
      expect(generateBreadcrumbStub).to.be.calledOnce;
    });

    context('the list items', () => {
      it('have an onclick that stored the match id', () => {
        pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);

        let listItems = pickAMatch.internal.matchList.getElementsByClassName('list-item');

        expect(listItems[0].innerHTML).to.equal(dataObj.seasons[1].matches[0].date + ' ' + dataObj.seasons[1].matches[0].squads.opponent.name);
        expect(typeof listItems[0].onclick).to.equal('function');
        listItems[0].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-match', dataObj.seasons[1].matches[0].id);

        expect(listItems[1].innerHTML).to.equal(dataObj.seasons[1].matches[1].date + ' ' + dataObj.seasons[1].matches[1].squads.opponent.name);
        expect(typeof listItems[1].onclick).to.equal('function');
        listItems[1].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-match', dataObj.seasons[1].matches[1].id);

        expect(listItems[2].innerHTML).to.equal(dataObj.seasons[1].matches[2].date + ' ' + dataObj.seasons[1].matches[2].squads.opponent.name);
        expect(typeof listItems[2].onclick).to.equal('function');
        listItems[2].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('store-team-match', dataObj.seasons[1].matches[2].id);
      });

      it('sorts the matches by date', () => {
        pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);

        let listItems = pickAMatch.internal.matchList.getElementsByClassName('list-item');

        expect(listItems[0].innerHTML).to.equal('2017-05-14 ' + dataObj.seasons[1].matches[0].squads.opponent.name);
        expect(listItems[1].innerHTML).to.equal('2017-05-21 ' + dataObj.seasons[1].matches[1].squads.opponent.name);
        expect(listItems[2].innerHTML).to.equal('2017-05-28 ' + dataObj.seasons[1].matches[2].squads.opponent.name);
      });

      it('get cleaned out on each load call', () => {
        pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);
        pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);
        pickAMatch.internal.returnTeamDataListener(undefined, undefined, dataObj, 1);

        let listItems = pickAMatch.internal.matchList.getElementsByClassName('list-item');
        expect(pickAMatch.internal.matchList.childNodes.length).to.equal(3);
        expect(listItems[0].innerHTML).to.equal(dataObj.seasons[1].matches[0].date + ' ' + dataObj.seasons[1].matches[0].squads.opponent.name);
        expect(listItems[1].innerHTML).to.equal(dataObj.seasons[1].matches[1].date + ' ' + dataObj.seasons[1].matches[1].squads.opponent.name);
        expect(listItems[2].innerHTML).to.equal(dataObj.seasons[1].matches[2].date + ' ' + dataObj.seasons[1].matches[2].squads.opponent.name);
      });
    });
  });

  describe('#teamDataSavedListener', () => {
    beforeEach(() => {
      pickAMatch.internal.dataObj = {
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
            ],
            matches: [
              {
                id: 1,
                date: '2017-05-21',
                squads: {
                  opponent: {
                    name: 'Newtown City'
                  }
                }
              },
              {
                id: 2,
                date: '2017-05-21',
                squads: {
                  opponent: {
                    name: 'New Town'
                  }
                }
              }
            ]
          },
          {
            name: '2011/2012'
          }
        ]
      };
      pickAMatch.internal.seasonId = 0;
    });

    it('calls to store newly created match', () => {
      pickAMatch.internal.teamDataSavedListener();
      expect(ipcRendererSendStub).to.be.calledWith('store-team-match', 2);
    });
  });

  describe('#teamMatchStoredListener', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      pickAMatch.init(stateManagerStub);

      pickAMatch.internal.dataObj = {
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
            ],
            matches: [
              {
                id: 2,
                date: '2017-05-21',
                squads: {
                  opponent: {
                    name: 'Newtown City'
                  }
                }
              },
              {
                id: 1,
                date: '2017-05-21',
                squads: {
                  opponent: {
                    name: 'New Town'
                  }
                }
              },
              {
                id: 3,
                date: '2017-05-28',
                squads: {
                  opponent: {
                    name: 'New City'
                  }
                }
              }
            ]
          },
          {
            name: '2011/2012'
          }
        ]
      };
      pickAMatch.internal.seasonId = 0;
      pickAMatch.internal.matchDate.value = '2017-05-28';
      pickAMatch.internal.matchOpponent.value = 'New City';
    });

    context('when we just added the match', () => {
      it('shows the match-editor', () => {
        pickAMatch.internal.teamMatchStoredListener(undefined, 3);
        expect(showStateStub).to.be.calledWith('pick-a-match', 'match-editor');
      });
    });

    context('when we select an existing match', () => {
      it('shows the match-stats', () => {
        pickAMatch.internal.teamMatchStoredListener(undefined, 2);
        expect(showStateStub).to.be.calledWith('pick-a-match', 'match-stats');
      });
    });
  });
});
