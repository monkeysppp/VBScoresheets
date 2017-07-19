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

describe('app/js/match-editor', () => {
  let jsdomCleanup;

  let matchEditor;

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
    matchEditor = proxyquire('../../../../app/js/states/match-editor.js',
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

    matchEditor.internal.stateManager = undefined;
    matchEditor.internal.matchDate = undefined;
    matchEditor.internal.matchOpponent = undefined;
    matchEditor.internal.breadcrumb = undefined;
    matchEditor.internal.filename = undefined;
    matchEditor.internal.dataObj = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof matchEditor.name).to.equal('string');
    expect(typeof matchEditor.state).to.equal('object');
    expect(typeof matchEditor.attach).to.equal('function');
    expect(typeof matchEditor.detach).to.equal('function');
    expect(typeof matchEditor.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for team-data-saved', () => {
      matchEditor.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', matchEditor.internal.teamDataSavedListener);
    });

    it('registers for return-team-data', () => {
      matchEditor.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', matchEditor.internal.returnTeamDataListener);
    });

    it('sends a get-team-data event', () => {
      matchEditor.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#detach', () => {
    let saveOnExitStub;

    beforeEach(() => {
      saveOnExitStub = sinon.stub(matchEditor.internal, 'saveOnExit').callsFake(() => {
        matchEditor.internal.teamDataSavedPromiseResolver();
      });
    });

    afterEach(() => {
      saveOnExitStub.restore();
    });

    it('returns a Promise', () => {
      return expect(matchEditor.detach()).to.not.be.rejected;
    });

    it('calls saveOnExit', () => {
      return expect(matchEditor.detach()).to.not.be.rejected
      .then(() => {
        expect(saveOnExitStub).to.be.calledOnce;
      });
    });

    it('deregisters for return-team-data', () => {
      return expect(matchEditor.detach()).to.not.be.rejected
      .then(() => {
        expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', matchEditor.internal.returnTeamDataListener);
      });
    });

    it('deregisters for team-data-saved', () => {
      return expect(matchEditor.detach()).to.not.be.rejected
      .then(() => {
        expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', matchEditor.internal.teamDataSavedListener);
      });
    });
  });

  describe('saveOnExit', () => {
    let teamDataSavedListenerStub;

    beforeEach(() => {
      teamDataSavedListenerStub = sinon.stub(matchEditor.internal, 'teamDataSavedListenerStub');
      matchEditor.internal.filename = 'someFile';
      matchEditor.internal.dataObj = {match:{}};
      matchEditor.internal.matchData = matchEditor.internal.dataObj.match;
      matchEditor.init({});
    });

    afterEach(() => {
      teamDataSavedListenerStub.restore();
    });

    it('calls to save the match data', () => {
      matchEditor.internal.saveOnExit();
      expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFile', {match:{}});
    });

    context('when match venue is defined', () => {
      beforeEach(() => {
        matchEditor.internal.matchVenue.value = 'sports hall';
      });

      it('saves the venue', () => {
        matchEditor.internal.saveOnExit();
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFile', {match:{venue:'sports hall'}});
      });
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {matchEditor.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
        matchEditor.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(matchEditor.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the matchVenue textbox', () => {
        expect(matchEditor.internal.matchVenue).to.equal(document.getElementById('input_match-editor_venue'));
      });

      it('finds the matchDate textbox', () => {
        expect(matchEditor.internal.matchDate).to.equal(document.getElementById('input_match-editor_date'));
      });

      it('finds the matchTime textbox', () => {
        expect(matchEditor.internal.matchTime).to.equal(document.getElementById('input_match-editor_time'));
      });

      it('finds the matchTeamNamesHome textbox', () => {
        expect(matchEditor.internal.matchTeamNamesHome).to.equal(document.getElementById('input_match-editor_team-heading-home'));
      });

      it('finds the matchTeamNamesAway textbox', () => {
        expect(matchEditor.internal.matchTeamNamesAway).to.equal(document.getElementById('input_match-editor_team-heading-away'));
      });

      it('finds the squadList textbox', () => {
        expect(matchEditor.internal.squadList).to.equal(document.getElementById('match-editor_player_list'));
      });

      it('finds the squadAddPlayerName textbox', () => {
        expect(matchEditor.internal.squadAddPlayerName).to.equal(document.getElementById('input_match-editor_add-player'));
      });

      it('finds the squadAddPlayerButton textbox', () => {
        expect(matchEditor.internal.squadAddPlayerButton).to.equal(document.getElementById('button_match-editor_add-player'));
      });

      it('finds the opponentList textbox', () => {
        expect(matchEditor.internal.opponentList).to.equal(document.getElementById('match-editor_opponent_list'));
      });

      it('finds the opponentAddPlayerName textbox', () => {
        expect(matchEditor.internal.opponentAddPlayerName).to.equal(document.getElementById('input_match-editor_add-opponent-name'));
      });

      it('finds the opponentAddPlayerNumber textbox', () => {
        expect(matchEditor.internal.opponentAddPlayerNumber).to.equal(document.getElementById('input_match-editor_add-opponent-number'));
      });

      it('finds the opponentAddPlayerButton textbox', () => {
        expect(matchEditor.internal.opponentAddPlayerButton).to.equal(document.getElementById('button_match-editor_add-opponent'));
      });

      it('finds the setsDiv', () => {
        expect(matchEditor.internal.setsDiv).to.equal(document.getElementById('div_match-editor_sets'));
      });

      it('finds the breadcrumb div', () => {
        expect(matchEditor.internal.breadcrumb).to.equal(document.getElementById('match-editor_breadcrumbs'));
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
      matchEditor.internal.dataObj = dataObj;
      matchEditor.internal.seasonId = 0;
      matchEditor.internal.matchId = 1;
      matchEditor.internal.matchData = dataObj.seasons[0].matches[0];
      matchEditor.init(stateManagerStub);
      matchEditor.internal.generateBreadcrumb();
      breadcrumbParts = document.getElementById('match-editor_breadcrumbs').childNodes;
    });

    it('generates a breadcrumb', () => {
      expect(breadcrumbParts[0].innerHTML).to.equal('Home');
      expect(breadcrumbParts[2].innerHTML).to.equal(dataObj.name);
      expect(breadcrumbParts[4].innerHTML).to.equal(dataObj.seasons[0].name);
      expect(breadcrumbParts[6].innerHTML).to.equal('Matches');
      expect(breadcrumbParts[8].innerHTML).to.equal(dataObj.seasons[0].matches[0].date + ' ' + dataObj.seasons[0].matches[0].squads.opponent.name);
    });

    it('cleans out the old breadcrumb on each call', () => {
      matchEditor.internal.generateBreadcrumb();
      matchEditor.internal.generateBreadcrumb();
      expect(breadcrumbParts.length).to.equal(9);
    });

    it('makes the home button show "pick-a-team"', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function');
      breadcrumbParts[0].onclick();
      expect(showStateStub).to.be.calledWith('match-editor', 'pick-a-team');
    });

    it('makes the team button show "pick-a-season"', () => {
      expect(typeof breadcrumbParts[2].onclick).to.equal('function');
      breadcrumbParts[2].onclick();
      expect(showStateStub).to.be.calledWith('match-editor', 'pick-a-season');
    });

    it('makes the season button show "main-branch"', () => {
      expect(typeof breadcrumbParts[4].onclick).to.equal('function');
      breadcrumbParts[4].onclick();
      expect(showStateStub).to.be.calledWith('match-editor', 'main-branch');
    });

    it('makes the matches button show "pick-a-match"', () => {
      expect(typeof breadcrumbParts[6].onclick).to.equal('function');
      breadcrumbParts[6].onclick();
      expect(showStateStub).to.be.calledWith('match-editor', 'pick-a-match');
    });

    it('makes the match button show "match-stats"', () => {
      expect(typeof breadcrumbParts[8].onclick).to.equal('function');
      breadcrumbParts[8].onclick();
      expect(showStateStub).to.be.calledWith('match-editor', 'match-stats');
    });
  });

  describe('#teamDataSavedListener', () => {
    let teamDataSavedPromiseResolverStub;

    beforeEach(() => {
      matchEditor.init({});
      teamDataSavedPromiseResolverStub = sinon.stub();
      matchEditor.internal.teamDataSavedPromiseResolver = teamDataSavedPromiseResolverStub;
    });

    it('calls to load the team data', () => {
      matchEditor.internal.teamDataSavedListener();
      expect(teamDataSavedPromiseResolverStub).to.be.calledOnce;
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
            {id: 5, name: 'Emma Emerton'},
            {id: 4, name: 'Debbie Davis'},
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
              venue: 'Fortress Victory',
              home_or_away: 'away',
              date: '2017-05-28',
              time: '11:00',
              squads: {
                us: [
                  {id: 1, number: 10},
                  {id: 2, number: 3},
                  {id: 3, number: 7},
                  {id: 4, number: 4},
                  {id: 5, number: 5},
                  {id: 6, number: 12},
                  {id: 7, number: 2},
                  {id: 8, number: 9},
                ],
                opponent: {
                  name: 'New City',
                  players: [
                    {name: 'Alice Player', number: 1},
                    {name: 'Betty Player', number: 4},
                    {name: 'Clare Player', number: 7},
                    {name: 'Diane Player', number: 2},
                    {name: 'Ellie Player', number: 5},
                    {name: 'Fiona Player', number: 9},
                  ]
                }
              },
              mvp: 1,
              sets: [
                {
                  serve: true,
                  lineups: {
                    us: [ 12,3,7,9,4,10 ],
                    opponent: [ 1,4,7,2,5,9 ]
                  },
                  scores: {
                    us: [ 3,4,6,7,10,12,14,17,18,25 ],
                    opponent: [ 1,3,5,7,8,10,11,12,21,22 ]
                  },
                  timeouts: {
                    us: [ [17,16], [17,20] ],
                    opponent: [[3,6]]
                  },
                  substitutions: [
                    {off: 3, on: 2, score: [17,18]}
                  ]
                },
                {
                  serve: false,
                  lineups: {
                    us: [ 3,7,9,4,10,12 ],
                    opponent: [ 1,4,7,2,5,9 ]
                  },
                  scores: {
                    us: [ 2,4,6,7,11,12,15,17,18,23,25 ],
                    opponent: [ 1,3,5,7,8,10,11,12,14,16,19 ]
                  },
                  timeouts: {
                    us: [ [8,7], [12,11] ],
                    opponent: [[19,24]]
                  },
                  substitutions: [
                    {off: 3, on: 2, score: [12,11]}
                  ]
                },
                {
                  serve: true,
                  lineups: {
                    us: [ 12,3,7,9,4,10 ],
                    opponent: [ 1,4,7,2,5,9 ]
                  },
                  scores: {
                    us: [ 3,4,6,7,10,12,14,17,18,25 ],
                    opponent: [ 1,3,5,7,8,10,11,12,21,22 ]
                  },
                  timeouts: {
                    us: [ [17,16], [17,20] ],
                    opponent: [[3,6]]
                  },
                  substitutions: [
                    {off: 3, on: 7, score: [17,18]}
                  ]
                }
              ]
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
      generateBreadcrumbStub = sinon.stub(matchEditor.internal, 'generateBreadcrumb');
      matchEditor.init(stateManagerStub);
      matchEditor.internal.dataObj = {};
      matchEditor.internal.filename = 'foo';
      matchEditor.internal.seasonId = 0;
      matchEditor.internal.matchId = 0;
    });

    afterEach(() => {
      generateBreadcrumbStub.restore();
    });

    context('with only the initial match data', () => {
      it('locally stores the filename', () => {
        matchEditor.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1, 1);
        expect(matchEditor.internal.filename).to.equal('someFileName');
      });

      it('locally stores the team data', () => {
        matchEditor.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1, 1);
        expect(matchEditor.internal.dataObj).to.deep.equal(dataObj);
      });

      it('locally stores the seasonId', () => {
        matchEditor.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1, 2);
        expect(matchEditor.internal.seasonId).to.equal(1);
      });

      it('locally stores the matchId', () => {
        matchEditor.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1, 2);
        expect(matchEditor.internal.matchId).to.equal(2);
      });

      it('finds the specified match', () => {
        matchEditor.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1, 2);
        expect(matchEditor.internal.matchData).to.deep.equal(dataObj.seasons[1].matches[0]);
      });

      it('clears and populates the initial match data fields', () => {
        matchEditor.internal.matchDate.value = '2001-01-01';
        matchEditor.internal.matchTeamNamesHome.value = 'someteam';
        matchEditor.internal.matchTeamNamesAway.value = 'someteam';
        matchEditor.internal.matchTime.value = '01:00';
        matchEditor.internal.matchVenue.innerHTML = 'foo';

        matchEditor.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1, 2);

        expect(matchEditor.internal.matchDate.value).to.equal(dataObj.seasons[1].matches[0].date);
        expect(matchEditor.internal.matchTeamNamesHome.innerHTML).to.equal(dataObj.name);
        expect(matchEditor.internal.matchTeamNamesAway.innerHTML).to.equal(dataObj.seasons[1].matches[0].squads.opponent.name);

        expect(matchEditor.internal.matchTime.value).to.equal('');
        expect(matchEditor.internal.matchVenue.value).to.equal('');
      });

      it('calls to generate the breadcrumb', () => {
        matchEditor.internal.returnTeamDataListener(undefined, undefined, dataObj, 1, 2);
        expect(generateBreadcrumbStub).to.be.calledOnce;
      });
    });

    context('with existing match data', () => {
      it('clears and populates the curent match data fields', () => {
        matchEditor.internal.matchDate.value = '2001-01-01';
        matchEditor.internal.matchTeamNamesHome.value = 'someteam';
        matchEditor.internal.matchTeamNamesAway.value = 'someteam';

        matchEditor.internal.matchTime.value = '01:00';

        matchEditor.internal.returnTeamDataListener(undefined, 'someFileName', dataObj, 1, 3);

        expect(matchEditor.internal.matchDate.value).to.equal(dataObj.seasons[1].matches[2].date);
        expect(matchEditor.internal.matchTeamNamesHome.innerHTML).to.equal(dataObj.name);
        expect(matchEditor.internal.matchTeamNamesAway.innerHTML).to.equal(dataObj.seasons[1].matches[2].squads.opponent.name);

        expect(matchEditor.internal.matchTime.value).to.equal(dataObj.seasons[1].matches[2].time);
        expect(matchEditor.internal.matchVenue.value).to.equal(dataObj.seasons[1].matches[2].venue);
      });
    });

  });

});
