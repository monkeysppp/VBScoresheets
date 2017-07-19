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

describe('app/js/pick-a-team', () => {
  let jsdomCleanup;

  let pickATeam;

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

    pickATeam.internal.stateManager = undefined;
    pickATeam.internal.teamAddButton = undefined;
    pickATeam.internal.teamName = undefined;
    pickATeam.internal.teamList = undefined;
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
      expect(ipcRendererOnStub).to.be.calledWith('return-team-files', pickATeam.internal.returnTeamFilesListener);
    });

    it('registers for team-data-saved', () => {
      pickATeam.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', pickATeam.internal.teamDataSavedListener);
    });

    it('registers for return-team-data', () => {
      pickATeam.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', pickATeam.internal.returnTeamDataListener);
    });

    it('sends a get-team-files event', () => {
      pickATeam.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-files');
    });
  });

  describe('#detach', () => {
    it('returns a Promise', () => {
      return expect(pickATeam.detach()).to.not.be.rejected;
    });

    it('deregisters for return-team-files', () => {
      return expect(pickATeam.detach()).to.not.be.rejected
      .then(() => {
        expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-files', pickATeam.internal.returnTeamFilesListener);
      });
    });

    it('deregisters for team-data-saved', () => {
      return expect(pickATeam.detach()).to.not.be.rejected
      .then(() => {
        expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', pickATeam.internal.teamDataSavedListener);
      });
    });

    it('deregisters for return-team-data', () => {
      return expect(pickATeam.detach()).to.not.be.rejected
      .then(() => {
        expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', pickATeam.internal.returnTeamDataListener);
      });
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
        pickATeam.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(pickATeam.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the teamAdd button', () => {
        expect(pickATeam.internal.teamAddButton).to.equal(document.getElementById('button_pick-a-team_add'));
      });

      it('finds the teamName textbox', () => {
        expect(pickATeam.internal.teamName).to.equal(document.getElementById('input_pick-a-team'));
      });

      it('finds the teamList div', () => {
        expect(pickATeam.internal.teamList).to.equal(document.getElementById('pick-a-team_list'));
      });

      it('sets the teamAdd onclick listener for the button', () => {
        expect(pickATeam.internal.teamAddButton.onclick).to.equal(pickATeam.internal.teamAddOnClick);
      });

      it('sets the oninput listener for the input', () => {
        expect(pickATeam.internal.teamName.oninput).to.equal(pickATeam.internal.teamNameOnInput);
      });
    });
  });

  describe('#teamAddOnClick', () => {
    beforeEach(() => {
      pickATeam.init({});
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        pickATeam.internal.teamName.value = '';
        pickATeam.internal.teamAddOnClick();
      });

      it('disables the button', () => {
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        pickATeam.internal.teamName.value = 'abc';
        pickATeam.internal.teamAddOnClick();
      });

      it('enables the button', () => {
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', undefined, {name:'abc'});
      });
    });
  });

  describe('#teamNameOnInput', () => {
    beforeEach(() => {
      pickATeam.init({});
      pickATeam.internal.teamAddButton.className = 'null';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        pickATeam.internal.teamName.value = '';
        pickATeam.internal.teamNameOnInput();
      });

      it('sets the button class to disabled', () => {
        expect(pickATeam.internal.teamAddButton.className).to.equal('button new-item-button-disabled');
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        pickATeam.internal.teamName.value = 'abc';
        pickATeam.internal.teamNameOnInput();
      });

      it('sets the button class to enabled', () => {
        expect(pickATeam.internal.teamAddButton.className).to.equal('button new-item-button');
      });
    });
  });

  describe('#returnTeamFilesListener', () => {
    let teamFileData = [
      {filename: 'file1',teamname: 'team1'},
      {filename: 'file2',teamname: 'team2'},
      {filename: 'file3',teamname: 'team3'}
    ];
    let stateManagerStub;

    beforeEach(() => {
      stateManagerStub = {};
      pickATeam.init(stateManagerStub);
    });

    it('creates a list of the teams', () => {
      pickATeam.internal.returnTeamFilesListener(undefined, teamFileData);
      expect(pickATeam.internal.teamList.childNodes.length).to.equal(3);
    });

    it('clears the curent teamName input and add button', () => {
      pickATeam.internal.teamName.value = 'sometext';
      pickATeam.internal.returnTeamFilesListener(undefined, teamFileData);
      expect(pickATeam.internal.teamName.value).to.equal('');
      expect(pickATeam.internal.teamAddButton.className).to.equal('button new-item-button-disabled');
    });

    context('the list items', () => {
      it('have an onclick that loads the team file', () => {
        pickATeam.internal.returnTeamFilesListener(undefined, teamFileData);

        let listItems = pickATeam.internal.teamList.getElementsByClassName('list-item');

        expect(listItems[0].innerHTML).to.equal('team1');
        expect(typeof listItems[0].onclick).to.equal('function');
        listItems[0].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('load-team-data', 'file1');

        expect(listItems[1].innerHTML).to.equal('team2');
        expect(typeof listItems[1].onclick).to.equal('function');
        listItems[1].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('load-team-data', 'file2');

        expect(listItems[2].innerHTML).to.equal('team3');
        expect(typeof listItems[2].onclick).to.equal('function');
        listItems[2].onclick();
        expect(ipcRendererSendStub).to.be.calledWith('load-team-data', 'file3');
      });

      it('get cleaned out on each load call', () => {
        pickATeam.internal.returnTeamFilesListener(undefined, teamFileData);
        pickATeam.internal.returnTeamFilesListener(undefined, teamFileData);
        pickATeam.internal.returnTeamFilesListener(undefined, teamFileData);

        let listItems = pickATeam.internal.teamList.getElementsByClassName('list-item');
        expect(pickATeam.internal.teamList.childNodes.length).to.equal(3);
        expect(listItems[0].innerHTML).to.equal('team1');
        expect(listItems[1].innerHTML).to.equal('team2');
        expect(listItems[2].innerHTML).to.equal('team3');
      });
    });
  });

  describe('#teamDataSavedListener', () => {
    it('calls to load the team data again', () => {
      pickATeam.internal.teamDataSavedListener(undefined, 'file1');
      expect(ipcRendererSendStub).to.be.calledWith('load-team-data', 'file1');
    });
  });

  describe('#returnTeamDataListener', () => {
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
        pickATeam.internal.returnTeamDataListener(undefined, 'file1', teamDataObj);
        expect(showStateStub).to.be.calledWith('pick-a-team', 'add-first-season');
      });
    });

    context('when the team data has seasons', () => {
      let teamDataObj = {
        name: 'team1',
        seasons: ['one', 'two', 'three']
      };

      it('calls to change state from pick-a-team to pick-a-season', () => {
        pickATeam.internal.returnTeamDataListener(undefined, 'file1', teamDataObj);
        expect(showStateStub).to.be.calledWith('pick-a-team', 'pick-a-season');
      });
    });
  });
});
