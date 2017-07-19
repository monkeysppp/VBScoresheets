'use strict';

const chai = require('chai');
const expect = chai.expect;

const jsdomGlobal = require('jsdom-global');
const fs = require('fs');
const path = require('path');

describe('app/js/add-first-team', () => {
  let jsdomCleanup;

  let loading;

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

    loading = require('../../../../app/js/states/loading.js');

    loading.internal.stateManager = undefined;
  });

  afterEach(() => {
    jsdomCleanup();
  });

  it('returns a state handler', () => {
    expect(typeof loading.name).to.equal('string');
    expect(typeof loading.state).to.equal('object');
    expect(typeof loading.attach).to.equal('function');
    expect(typeof loading.detach).to.equal('function');
    expect(typeof loading.init).to.equal('function');
  });

  describe('#attach', () => {
    it('does nothing', () => {
      loading.attach();
    });
  });

  describe('#detach', () => {
    it('returns a Promise', () => {
      return expect(loading.detach()).to.not.be.rejected;
    });
  });

  describe('#init', () => {
    context('called without a state-manager', () => {
      it('throws an error', () => {
        expect(() => {loading.init();}).to.throw('no state-manager given');
      });
    });

    context('called with a state-manager', () => {
      let stateManagerStub;

      beforeEach(() => {
        stateManagerStub = {};
      });

      it('saves the state manager', () => {
        loading.init(stateManagerStub);
        expect(loading.internal.stateManager).to.equal(stateManagerStub);
      });

    });
  });

});
