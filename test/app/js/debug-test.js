const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const expect = require('chai').expect;
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);
const proxyquire = require('proxyquire').noCallThru();

describe('app/js/debug', () => {
  let debug;
  let ipcRendererSendStub;
  let originalEnvDEBUG;

  const testString = 'some test string';
  const ipcChannel = 'ui-debug';

  beforeEach(() => {
    ipcRendererSendStub = sinon.stub();
    debug = proxyquire('../../../app/js/debug.js', {
      electron: {
        ipcRenderer: {
          send: ipcRendererSendStub
        }
      }
    });

    originalEnvDEBUG = process.env.DEBUG;
  });

  afterEach(() => {
    process.env.DEBUG = originalEnvDEBUG;
  });

  context('when debug is turned off', () => {
    context('when DEBUG is undefined', () => {
      beforeEach(() => {
        delete process.env.DEBUG;
      });

      it('does not send the debug message', () => {
        debug(testString);
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });

    context('when DEBUG does not include vbs:', () => {
      beforeEach(() => {
        process.env.DEBUG = 'somelongunlikelystring';
      });

      it('does not send the debug message', () => {
        debug(testString);
        expect(ipcRendererSendStub).to.not.be.called;
      });
    });
  });

  context('when debug is turned on', () => {
    beforeEach(() => {
      process.env.DEBUG = 'somelongunlikelystring,vbs:*,anotherlongunlikelystring';
    });

    it('sends the debug message', () => {
      debug(testString);
      expect(ipcRendererSendStub).to.be.calledOnce;
      expect(ipcRendererSendStub).to.be.calledWith(ipcChannel, testString);
    });
  });
});
