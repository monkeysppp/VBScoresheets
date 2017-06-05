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

describe('app/js/pick-a-team', () => {
  let jsdomCleanup;

  let pickATeam;

  let ipcRendererSendStub;
  let ipcRendererOnStub;
  let ipcRendererRemoveListenerStub;

  beforeEach(function () {
    this.timeout(10000);
    jsdomCleanup = jsdomGlobal();
    document.body.innerHTML = '<div id="pick-a-team_list" class="scrollable team-list"></div>';
    ipcRendererSendStub = sinon.stub();
    ipcRendererOnStub = sinon.stub();
    ipcRendererRemoveListenerStub = sinon.stub();
    pickATeam = proxyquire('../../../../app/js/states/pick-a-team.js',
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
    expect(typeof pickATeam.name).to.equal('string');
    expect(typeof pickATeam.state).to.equal('object');
    expect(typeof pickATeam.attach).to.equal('function');
    expect(typeof pickATeam.detach).to.equal('function');
    expect(typeof pickATeam.init).to.equal('function');
  });

  describe('#attach', () => {
    it('registers for return-team-files', () => {
      pickATeam.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-files', pickATeam.internal.teamFilesListener);
    });

    it('registers for team-data-saved', () => {
      pickATeam.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', pickATeam.internal.teamDataSavedListener);
    });

    it('registers for return-team-data', () => {
      pickATeam.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', pickATeam.internal.teamDataListener);
    });

    it('sends a get-team-files event', () => {
      pickATeam.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-files');
    });
  });

  describe('#detach', () => {
    it('deregisters for return-team-files', () => {
      pickATeam.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-files', pickATeam.internal.teamFilesListener);
    });

    it('deregisters for team-data-saved', () => {
      pickATeam.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', pickATeam.internal.teamDataSavedListener);
    });

    it('deregisters for return-team-data', () => {
      pickATeam.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', pickATeam.internal.teamDataListener);
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {pickATeam.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
      });

      it('saves the state manager', () => {
        pickATeam.init(stateManagerStub);
        expect(pickATeam.internal.stateManager).to.equal(stateManagerStub);
      });
    });
  });

  describe('#teamFilesListener', () => {
    let teamFileData = [
      {filename: 'file1',teamname: 'team1'},
      {filename: 'file2',teamname: 'team2'},
      {filename: 'file3',teamname: 'team3'}
    ];

    it('creates a list of the teams', () => {
      pickATeam.internal.teamFilesListener(undefined, teamFileData);

      let listItems = document.getElementById('pick-a-team_list').getElementsByClassName('list-item');
      expect(listItems.length).to.equal(3);
    });

    context('the list items', () => {
      let pickFileStub;

      beforeEach(() => {
        pickFileStub = sinon.stub(pickATeam.internal, 'pickFile');
      });

      afterEach(() => {
        pickFileStub.restore();
      });

      it('have an onclick that picks the related file', () => {
        pickATeam.internal.teamFilesListener(undefined, teamFileData);

        let listItems = document.getElementById('pick-a-team_list').getElementsByClassName('list-item');

        expect(listItems[0].innerHTML).to.equal('team1');
        expect(typeof listItems[0].onclick).to.equal('function');
        listItems[0].onclick();
        expect(pickFileStub).to.be.calledWith('file1', 'team1');

        expect(listItems[1].innerHTML).to.equal('team2');
        expect(typeof listItems[1].onclick).to.equal('function');
        listItems[1].onclick();
        expect(pickFileStub).to.be.calledWith('file2', 'team2');

        expect(listItems[2].innerHTML).to.equal('team3');
        expect(typeof listItems[2].onclick).to.equal('function');
        listItems[2].onclick();
        expect(pickFileStub).to.be.calledWith('file3', 'team3');
      });
    });

    it('adds a button for a new team with onclick listener', () => {
      pickATeam.internal.teamFilesListener(undefined, teamFileData);

      let button = document.getElementById('button_pick-a-team');

      expect(typeof button.onclick).to.equal('function');
    });

    context('the onclick listener', () => {
      context('when input is zero length', () => {
        let button;
        let input;

        beforeEach(() => {
          pickATeam.internal.teamFilesListener(undefined, teamFileData);
          button = document.getElementById('button_pick-a-team');
          input = document.getElementById('input_pick-a-team');
          input.value = '';
          button.onclick();
        });

        it('disables the button', () => {
          expect(ipcRendererSendStub).to.not.be.called;
        });
      });

      context('when input is longer than zero length', () => {
        let button;
        let input;

        beforeEach(() => {
          pickATeam.internal.teamFilesListener(undefined, teamFileData);
          button = document.getElementById('button_pick-a-team');
          input = document.getElementById('input_pick-a-team');
          input.value = 'abc';
          button.onclick();
        });

        it('enables the button', () => {
          expect(ipcRendererSendStub).to.be.calledWith('save-team-data', undefined, {name:'abc'});
        });
      });
    });

    it('adds an input for a new team with oninput listener', () => {
      pickATeam.internal.teamFilesListener(undefined, teamFileData);

      let input = document.getElementById('input_pick-a-team');

      expect(typeof input.oninput).to.equal('function');
    });

    context('the oninput listener', () => {
      context('when input is zero length', () => {
        let button;
        let input;

        beforeEach(() => {
          pickATeam.internal.teamFilesListener(undefined, teamFileData);
          button = document.getElementById('button_pick-a-team');
          input = document.getElementById('input_pick-a-team');
          input.value = '';
          input.oninput();
        });

        it('sets the button class to disabled', () => {
          expect(button.className).to.equal('button new-item-button-disabled');
        });
      });

      context('when input is longer than zero length', () => {
        let button;
        let input;

        beforeEach(() => {
          pickATeam.internal.teamFilesListener(undefined, teamFileData);
          button = document.getElementById('button_pick-a-team');
          input = document.getElementById('input_pick-a-team');
          input.value = 'abc';
          input.oninput();
        });

        it('sets the button class to enabled', () => {
          expect(button.className).to.equal('button new-item-button');
        });
      });
    });

    it('cleans out previous DOM elements', () => {
      pickATeam.internal.teamFilesListener(undefined, teamFileData);
      pickATeam.internal.teamFilesListener(undefined, teamFileData);
      pickATeam.internal.teamFilesListener(undefined, teamFileData);

      let listItems = document.getElementById('pick-a-team_list').getElementsByClassName('list-item');
      expect(listItems.length).to.equal(3);
      expect(listItems[0].innerHTML).to.equal('team1');
      expect(listItems[1].innerHTML).to.equal('team2');
      expect(listItems[2].innerHTML).to.equal('team3');
    });
  });

  describe('#teamDataSavedListener', () => {
    let pickFileStub;

    beforeEach(() => {
      pickFileStub = sinon.stub(pickATeam.internal, 'pickFile');
    });

    afterEach(() => {
      pickFileStub.restore();
    });

    it('calls pickFile', () => {
      pickATeam.internal.teamDataSavedListener(undefined, 'aFileName');
      expect(pickFileStub).to.be.calledWith('aFileName');
    });
  });

  describe('#teamDataListener', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      pickATeam.init(stateManagerStub);
    });

    context('when the team data does not have seasons', () => {
      let teamDataObj = {
        name: 'team1'
      };

      it('calls to change state from pick-a-team to add-first-season', () => {
        pickATeam.internal.teamDataListener(undefined, 'file1', teamDataObj);
        expect(showStateStub).to.be.calledWith('pick-a-team', 'add-first-season');
      });
    });

    context('when the team data has seasons', () => {
      let teamDataObj = {
        name: 'team1',
        seasons: ['one', 'two', 'three']
      };

      it('calls to change state from pick-a-team to pick-a-season', () => {
        pickATeam.internal.teamDataListener(undefined, 'file1', teamDataObj);
        expect(showStateStub).to.be.calledWith('pick-a-team', 'pick-a-season');
      });

    });
  });

  describe('#pickFile', () => {
    it('sends load-team-data for the requested filename', () => {
      pickATeam.internal.pickFile('someFileName');
      expect(ipcRendererSendStub).to.be.calledWith('load-team-data', 'someFileName');
    });
  });
});
