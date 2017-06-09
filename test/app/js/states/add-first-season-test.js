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

describe('app/js/add-first-season', () => {
  let jsdomCleanup;

  let addFirstSeason;

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

    addFirstSeason.internal.stateManager = undefined;
    addFirstSeason.internal.seasonAddButton = undefined;
    addFirstSeason.internal.seasonName = undefined;
    addFirstSeason.internal.breadcrumb = undefined;
    addFirstSeason.internal.filename = undefined;
    addFirstSeason.internal.dataObj = undefined;
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
    it('registers for return-team-data', () => {
      addFirstSeason.attach();
      expect(ipcRendererOnStub).to.be.calledWith('return-team-data', addFirstSeason.internal.teamGetListener);
    });

    it('registers for team-data-saved', () => {
      addFirstSeason.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-data-saved', addFirstSeason.internal.teamSaveListener);
    });

    it('registers for team-season-stored', () => {
      addFirstSeason.attach();
      expect(ipcRendererOnStub).to.be.calledWith('team-season-stored', addFirstSeason.internal.teamSeasonStoreListener);
    });

    it('sends a get-team-data event', () => {
      addFirstSeason.attach();
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith('get-team-data');
    });
  });

  describe('#detach', () => {
    it('deregisters for return-team-data', () => {
      addFirstSeason.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('return-team-data', addFirstSeason.internal.teamGetListener);
    });

    it('deregisters for team-data-saved', () => {
      addFirstSeason.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-data-saved', addFirstSeason.internal.teamSaveListener);
    });

    it('deregisters for team-season-stored', () => {
      addFirstSeason.detach();
      expect(ipcRendererRemoveListenerStub).to.be.calledWith('team-season-stored', addFirstSeason.internal.teamSeasonStoreListener);
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

      beforeEach(() => {
        stateManagerStub = {};
        addFirstSeason.init(stateManagerStub);
      });

      it('saves the state manager', () => {
        expect(addFirstSeason.internal.stateManager).to.equal(stateManagerStub);
      });

      it('finds the seasonAdd button', () => {
        expect(addFirstSeason.internal.seasonAddButton).to.equal(document.getElementById('button_add-first-season_add'));
      });

      it('finds the seasonName textbox', () => {
        expect(addFirstSeason.internal.seasonName).to.equal(document.getElementById('input_add-first-season'));
      });

      it('finds the breadcrumb div', () => {
        expect(addFirstSeason.internal.breadcrumb).to.equal(document.getElementById('add-first-season_breadcrumbs'));
      });

      it('sets the seasonAdd onclick listener for the button', () => {
        expect(addFirstSeason.internal.seasonAddButton.onclick).to.equal(addFirstSeason.internal.seasonAddOnClick);
      });

      it('sets the oninput listener for the input', () => {
        expect(addFirstSeason.internal.seasonName.oninput).to.equal(addFirstSeason.internal.seasonNameOnInput);
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
        name: 'team1'
      };
      addFirstSeason.internal.dataObj = dataObj;
      addFirstSeason.init(stateManagerStub);
      addFirstSeason.internal.generateBreadcrumb();
      breadcrumbParts = document.getElementById('add-first-season_breadcrumbs').childNodes;
    });

    it('generates a breadcrumb', () => {
      expect(breadcrumbParts[0].innerHTML).to.equal('Home');
      expect(breadcrumbParts[2].innerHTML).to.equal(dataObj.name);
    });

    it('cleans out the old breadcrumb on each call', () => {
      addFirstSeason.internal.generateBreadcrumb();
      addFirstSeason.internal.generateBreadcrumb();
      expect(breadcrumbParts.length).to.equal(3);
    });

    it('', () => {
      expect(typeof breadcrumbParts[0].onclick).to.equal('function');
      breadcrumbParts[0].onclick();
      expect(showStateStub).to.be.calledWith('add-first-season', 'pick-a-team');
    });
  });

  describe('#seasonAddOnClick', () => {
    let startingDataObj;
    let expectedDataObj;

    beforeEach(() => {
      startingDataObj = {
        name:'team1'
      };
      expectedDataObj = {
        name:'team1',
        seasons:[{name:'abc'}]
      };
      addFirstSeason.init({});
      addFirstSeason.internal.dataObj = startingDataObj;
      addFirstSeason.internal.filename = 'someFileName';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstSeason.internal.seasonName.value = '';
        addFirstSeason.internal.seasonAddOnClick();
      });

      it('disables the button', () => {
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstSeason.internal.seasonName.value = 'abc';
        addFirstSeason.internal.seasonAddOnClick();
      });

      it('enables the button', () => {
        expect(ipcRendererSendStub).to.be.calledWith('save-team-data', 'someFileName', expectedDataObj);
      });
    });
  });

  describe('#seasonNameOnInput', () => {
    beforeEach(() => {
      addFirstSeason.init({});
      addFirstSeason.internal.seasonAddButton.className = 'null';
    });

    context('when input is zero length', () => {
      beforeEach(() => {
        addFirstSeason.internal.seasonName.value = '';
        addFirstSeason.internal.seasonNameOnInput();
      });

      it('sets the button class to disabled', () => {
        expect(addFirstSeason.internal.seasonAddButton.className).to.equal('button new-item-button-disabled');
      });
    });

    context('when input is longer than zero length', () => {
      beforeEach(() => {
        addFirstSeason.internal.seasonName.value = 'abc';
        addFirstSeason.internal.seasonNameOnInput();
      });

      it('sets the button class to enabled', () => {
        expect(addFirstSeason.internal.seasonAddButton.className).to.equal('button new-item-button');
      });
    });
  });

  describe('#teamSaveListener', () => {
    beforeEach(() => {
      addFirstSeason.init({});
    });

    it('calls to save the team season id', () => {
      addFirstSeason.internal.teamSaveListener();
      expect(ipcRendererSendStub).to.be.calledWith('store-team-season', 0);
    });
  });

  describe('#teamGetListener', () => {
    let stateManagerStub;
    let showStateStub;
    let generateBreadcrumbStub;
    let dataObj = {
      name: 'team1'
    };

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      generateBreadcrumbStub = sinon.stub(addFirstSeason.internal, 'generateBreadcrumb');
      addFirstSeason.init(stateManagerStub);
      addFirstSeason.internal.dataObj = {};
    });

    afterEach(() => {
      generateBreadcrumbStub.restore();
    });

    it('locally stores the filename', () => {
      addFirstSeason.internal.teamGetListener(undefined, 'someFileName', dataObj);
      expect(addFirstSeason.internal.filename).to.equal('someFileName');
    });

    it('locally stores the team data', () => {
      addFirstSeason.internal.teamGetListener(undefined, undefined, dataObj);
      expect(addFirstSeason.internal.dataObj).to.deep.equal(dataObj);
    });

    it('clears the curent seasonName input and add button', () => {
      addFirstSeason.internal.seasonName.value = 'sometext';
      addFirstSeason.internal.teamGetListener(undefined, undefined, dataObj);
      expect(addFirstSeason.internal.seasonName.value).to.equal('');
      expect(addFirstSeason.internal.seasonAddButton.className).to.equal('button new-item-button-disabled');
    });

    it('calls to generate the breadcrumb', () => {
      addFirstSeason.internal.teamGetListener(undefined, undefined, dataObj);
      expect(generateBreadcrumbStub).to.be.calledOnce;
    });
  });

  describe('#teamSeasonStoreListener', () => {
    let stateManagerStub;
    let showStateStub;

    beforeEach(() => {
      showStateStub = sinon.stub();
      stateManagerStub = {
        showState: showStateStub
      };
      addFirstSeason.init(stateManagerStub);
    });

    it('calls to change state from add-first-season to add-first-squad', () => {
      addFirstSeason.internal.teamSeasonStoreListener();
      expect(showStateStub).to.be.calledWith('add-first-season', 'add-first-squad');
    });
  });

});
