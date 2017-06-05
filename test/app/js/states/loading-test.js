'use strict';

const chai = require('chai');
const expect = chai.expect;

const jsdomGlobal = require('jsdom-global');

describe('app/js/add-first-team', () => {
  let jsdomCleanup;

  let loading;

  beforeEach(function () {
    this.timeout(10000);
    jsdomCleanup = jsdomGlobal();
    document.body.innerHTML = '<div class="loading"></div>';
    loading = require('../../../../app/js/states/loading.js');
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
    it('does nothing', () => {
      loading.detach();
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
