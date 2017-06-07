'use strict';

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const proxyquire = require('proxyquire').noCallThru();
const files = require('../lib/files.js');

describe('main', function() {
  this.timeout(10000);

  let main;

  let electronAppOnStub;
  let electronAppQuitStub;
  let electronBrowserWindowStub;
  let electronIpcOnStub;
  let debugCreationStub;
  let debugReportStub;

  let testFilename = 'testFilename';
  let testSeason = 1;
  let testMatch = 1;
  let testPlayer = 1;
  let testData = {
    name: 'testTeam',
    seasons: [
      {
        name: testSeason,
        players: [
          {id: 1, name: 'testPlayer'}
        ],
        matches: [
          {venue: 'sports centre'}
        ]
      }
    ]
  };

  beforeEach(() => {
    electronAppOnStub = sinon.stub();
    electronAppQuitStub = sinon.stub();
    electronBrowserWindowStub = sinon.stub();
    electronIpcOnStub = sinon.stub();
    debugReportStub = sinon.stub();
    debugCreationStub = sinon.stub().returns(debugReportStub);
    main = proxyquire('../main.js',
      {
        electron: {
          app: {
            on: electronAppOnStub,
            quit: electronAppQuitStub
          },
          BrowserWindow: electronBrowserWindowStub,
          ipcMain: {
            on: electronIpcOnStub,
          }
        },
        debug: debugCreationStub
      }
    );
    main.internal.mainWindow = null;
    main.internal.teamFilename = testFilename;
    main.internal.teamData = testData;
    main.internal.teamSeason = testSeason;
    main.internal.teamMatch = testMatch;
    main.internal.teamPlayer = testPlayer;
  });

  context('app', () => {
    it('listens for ready', () => {
      expect(electronAppOnStub).to.be.calledWith('ready', main.internal.createWindow);
    });

    context('#createWindow', () => {
      let loadURLStub;
      let onStub;

      beforeEach(() => {
        loadURLStub = sinon.stub();
        onStub = sinon.stub();
        electronBrowserWindowStub.returns({
          loadURL: loadURLStub,
          on: onStub
        });
        main.internal.createWindow();
      });

      afterEach(() => {
        electronBrowserWindowStub.reset();
      });

      it('creates a new window with BrowserWindow()', () => {
        let callArgs;
        expect(electronBrowserWindowStub).to.be.called;

        callArgs = electronBrowserWindowStub.firstCall.args[0];
        expect(callArgs.frame).to.equal(false);
        expect(callArgs.resizable).to.equal(true);
        expect(typeof callArgs.height).to.equal('number');
        expect(typeof callArgs.minHeight).to.equal('number');
        expect(typeof callArgs.width).to.equal('number');
        expect(typeof callArgs.minWidth).to.equal('number');
      });

      it('stored the main window', () => {
        expect(main.internal.mainWindow).to.not.equal(null);
      });

      it('loads index.html', () => {
        expect(loadURLStub).to.be.calledWithMatch(/app\/index.html/);
      });

      it('registers the main window for close events', () => {
        expect(onStub).to.be.calledWith('closed', main.internal.mainWindowClose);
      });

      context('mainWindowClose', () => {
        beforeEach(() => {
          main.internal.mainWindow = {};
        });

        it('sets mainWindow to null', () => {
          main.internal.mainWindowClose();
          expect(main.internal.mainWindow).to.equal(null);
        });
      });
    });

    it('listens for window-all-closed', () => {
      expect(electronAppOnStub).to.be.calledWith('window-all-closed', main.internal.windowAllClosedListener);
    });

    context('#windowAllClosed', () => {
      let originalPlatform = process.platform;

      afterEach(() => {
        Object.defineProperty(process, 'platform', {value: originalPlatform});
      });

      context('when platform is darwin', () => {
        beforeEach(() => {
          Object.defineProperty(process, 'platform', {value: 'darwin'});
        });

        it('does nothing', () => {
          main.internal.windowAllClosedListener();
          expect(electronAppQuitStub).to.not.be.called;
        });
      });

      context('when platform is not darwin', () => {
        beforeEach(() => {
          Object.defineProperty(process, 'platform', {value: 'linux'});
        });

        it('calls to quit the app', () => {
          main.internal.windowAllClosedListener();
          expect(electronAppQuitStub).to.be.called;
        });
      });
    });

    it('listens for activate', () => {
      expect(electronAppOnStub).to.be.calledWith('activate', main.internal.activateListener);
    });

    context('#activateListener', () => {
      let createWindowStub;

      beforeEach(() => {
        createWindowStub = sinon.stub(main.internal, 'createWindow');
      });

      afterEach(() => {
        createWindowStub.restore();
      });

      context('when mainWindow is null', () => {
        it('calls to create window', () => {
          main.internal.activateListener();
          expect(createWindowStub).to.be.called;
        });
      });

      context('when mainWindow is defined', () => {
        beforeEach(() => {
          main.internal.mainWindow = {};
        });

        it('does nothing', () => {
          main.internal.activateListener();
          expect(createWindowStub).to.not.be.called;
        });
      });
    });
  });

  context('ipcMain', () => {
    it('listens for index-ready', () => {
      expect(electronIpcOnStub).to.be.calledWith('index-ready', main.internal.indexReadyListener);
    });

    context('#indexReadyListener', () => {
      let filesListStub;
      let event;
      let filesList = [
        {filename: 'file1', teamname: 'team1'},
        {filename: 'file2', teamname: 'team2'}
      ];

      beforeEach(() => {
        filesListStub = sinon.stub(files, 'listTeamFiles');
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      afterEach(() => {
        filesListStub.restore();
      });

      context('when file list succeeds', () => {
        context('with a list of files', () => {
          beforeEach(() => {
            filesListStub.returns(Promise.resolve(filesList));
            return main.internal.indexReadyListener(event);
          });

          it('sends an event to change state to pick-a-team', ()=> {
            expect(event.sender.send).to.be.calledWith('change-state', 'loading', 'pick-a-team');
          });
        });

        context('with an empty list', () => {
          beforeEach(() => {
            filesListStub.returns(Promise.resolve([]));
            return main.internal.indexReadyListener(event);
          });

          it('sends an event to change state to add-first-team', ()=> {
            expect(event.sender.send).to.be.calledWith('change-state', 'loading', 'add-first-team');
          });
        });
      });

      context('when file list fails', () => {
        beforeEach(() => {
          filesListStub.rejects(new Error('Bang!'));
          return main.internal.indexReadyListener(event);
        });

        it('does not send an event to change state', ()=> {
          expect(event.sender.send).to.not.be.called;
        });
      });
    });

    it('listens for close-main-window', () => {
      expect(electronIpcOnStub).to.be.calledWith('close-main-window', main.internal.closeMainWindowListener);
    });

    context('#closeMainWindowListener', () => {
      it('calls to quit the app', () => {
        main.internal.closeMainWindowListener();
        expect(electronAppQuitStub).to.be.called;
      });
    });

    it('listens for get-team-files', () => {
      expect(electronIpcOnStub).to.be.calledWith('get-team-files', main.internal.getTeamFilesListener);
    });

    context('#getTeamFilesListener', () => {
      let filesListStub;
      let event;
      let filesList = [
        {filename: 'file1', teamname: 'team1'},
        {filename: 'file2', teamname: 'team2'}
      ];

      beforeEach(() => {
        filesListStub = sinon.stub(files, 'listTeamFiles');
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      afterEach(() => {
        filesListStub.restore();
      });

      context('when file list succeeds', () => {
        beforeEach(() => {
          filesListStub.returns(Promise.resolve(filesList));
          return main.internal.getTeamFilesListener(event);
        });

        it('sends an event with the file list', ()=> {
          expect(event.sender.send).to.be.calledWith('return-team-files', filesList);
        });
      });

      context('when file list fails', () => {
        beforeEach(() => {
          filesListStub.rejects(new Error('Bang!'));
          return main.internal.getTeamFilesListener(event);
        });

        it('does not send an event with the file list', ()=> {
          expect(event.sender.send).to.not.be.called;
        });
      });
    });

    it('listens for save-team-data', () => {
      expect(electronIpcOnStub).to.be.calledWith('save-team-data', main.internal.saveTeamDataListener);
    });

    context('#saveTeamDataListener', () => {
      let filesSaveStub;
      let event;
      let newTestData = {
        name: 'some new name'
      };

      beforeEach(() => {
        filesSaveStub = sinon.stub(files, 'saveTeamFile');
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      afterEach(() => {
        filesSaveStub.restore();
      });

      context('when file save succeeds', () => {
        let realTestFilename = 'realTestfile';

        beforeEach(() => {
          filesSaveStub.returns(Promise.resolve(realTestFilename));
          return main.internal.saveTeamDataListener(event, 'testFile', newTestData);
        });

        it('sends an event with the real filename used, and acknowledges', () => {
          expect(event.sender.send).to.be.calledWith('team-data-saved', realTestFilename);
        });

        it('saves the filename and data, and leaves any selectors untouched', () => {
          expect(main.internal.teamFilename).to.equal(realTestFilename);
          expect(main.internal.teamData).to.deep.equal(newTestData);
          expect(main.internal.teamSeason).to.equal(testSeason);
          expect(main.internal.teamMatch).to.equal(testMatch);
          expect(main.internal.teamPlayer).to.equal(testPlayer);
        });
      });

      context('when file save fails', () => {
        beforeEach(() => {
          filesSaveStub.returns(Promise.reject(new Error('Bang!')));
          return main.internal.saveTeamDataListener(event, 'testFile', newTestData);
        });

        it('does not return any data', () => {
          expect(event.sender.send).to.not.be.called;
        });

        it('does not change the saved data or selectors', () => {
          expect(main.internal.teamFilename).to.equal(testFilename);
          expect(main.internal.teamData).to.deep.equal(testData);
          expect(main.internal.teamSeason).to.equal(testSeason);
          expect(main.internal.teamMatch).to.equal(testMatch);
          expect(main.internal.teamPlayer).to.equal(testPlayer);
        });
      });
    });

    it('listens for load-team-data', () => {
      expect(electronIpcOnStub).to.be.calledWith('load-team-data', main.internal.loadTeamDataListener);
    });

    context('#loadTeamDataListener', () => {
      let filesLoadStub;
      let event;

      beforeEach(() => {
        filesLoadStub = sinon.stub(files, 'loadTeamFile');
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      afterEach(() => {
        filesLoadStub.restore();
      });

      context('when file loading succeeds', () => {
        let newTestData = {
          name: 'some new name'
        };

        beforeEach(() => {
          filesLoadStub.returns(Promise.resolve(newTestData));
          return main.internal.loadTeamDataListener(event, 'testFile');
        });

        it('sends an event with the loaded filename and data', () => {
          expect(event.sender.send).to.be.calledWith('return-team-data', 'testFile', newTestData);
        });

        it('saves the filename and data, and clears any selectors', () => {
          expect(main.internal.teamFilename).to.equal('testFile');
          expect(main.internal.teamData).to.deep.equal(newTestData);
          expect(main.internal.teamSeason).to.equal(undefined);
          expect(main.internal.teamMatch).to.equal(undefined);
          expect(main.internal.teamPlayer).to.equal(undefined);
        });
      });

      context('when file loading fails', () => {
        beforeEach(() => {
          filesLoadStub.returns(Promise.reject(new Error('Bang!')));
          return main.internal.loadTeamDataListener(event, 'testFile');
        });

        it('does not return any data', () => {
          expect(event.sender.send).to.not.be.called;
        });

        it('does not change the saved data or selectors', () => {
          expect(main.internal.teamFilename).to.equal(testFilename);
          expect(main.internal.teamData).to.deep.equal(testData);
          expect(main.internal.teamSeason).to.equal(testSeason);
          expect(main.internal.teamMatch).to.equal(testMatch);
          expect(main.internal.teamPlayer).to.equal(testPlayer);
        });
      });
    });

    it('listens for store-team-season', () => {
      expect(electronIpcOnStub).to.be.calledWith('store-team-season', main.internal.storeTeamSeasonListener);
    });

    context('#storeTeamSeasonListener', () => {
      let event;

      beforeEach(() => {
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      it('stores the id of the selected season, then acknowledges with the id', () => {
        main.internal.storeTeamSeasonListener(event, 2);
        expect(main.internal.teamSeason).to.equal(2);
        expect(event.sender.send).to.be.calledWith('team-season-stored', 2);
      });
    });

    it('listens for store-team-match', () => {
      expect(electronIpcOnStub).to.be.calledWith('store-team-match', main.internal.storeTeamMatchListener);
    });

    context('#storeTeamMatchListener', () => {
      let event;

      beforeEach(() => {
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      it('stores the id of the selected match, then acknowledges with the id', () => {
        main.internal.storeTeamMatchListener(event, 2);
        expect(main.internal.teamMatch).to.equal(2);
        expect(event.sender.send).to.be.calledWith('team-match-stored', 2);
      });
    });

    it('listens for store-team-player', () => {
      expect(electronIpcOnStub).to.be.calledWith('store-team-player', main.internal.storeTeamPlayerListener);
    });

    context('#storeTeamPlayerListener', () => {
      let event;

      beforeEach(() => {
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      it('stores the id of the selected player, then acknowledges with the id', () => {
        main.internal.storeTeamPlayerListener(event, 2);
        expect(main.internal.teamPlayer).to.equal(2);
        expect(event.sender.send).to.be.calledWith('team-player-stored', 2);
      });
    });

    it('listens for get-team-data', () => {
      expect(electronIpcOnStub).to.be.calledWith('get-team-data', main.internal.getTeamDataListener);
    });

    context('#getTeamDataListener', () => {
      let event;

      beforeEach(() => {
        event = {
          sender: {
            send: sinon.stub()
          }
        };
      });

      it('sends an event with the team data and any selectors that are set', () => {
        main.internal.getTeamDataListener(event);
        expect(event.sender.send).to.be.calledWith('return-team-data', testFilename, testData, testSeason, testMatch, testPlayer);
      });
    });

    it('listens for ui-debug', () => {
      expect(electronIpcOnStub).to.be.calledWith('ui-debug', main.internal.reportDebugUI);
    });

    context('#reportDebugUI', () => {
      it('reports to debug', () => {
        main.internal.reportDebugUI(undefined, 'test message');
        expect(debugCreationStub).to.be.calledWith('vbs:ui');
        expect(debugReportStub).to.be.calledWith('test message');
      });
    });
  });

});
