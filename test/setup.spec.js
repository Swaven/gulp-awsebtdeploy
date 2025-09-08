
'use strict';

const setup = require('../lib/setup'),
  expect = require('chai').expect;

describe('Initial option validation check', function() {
  var opts = {
    region: 'us-west-1',
    applicationName: 'test-app',
    environmentName: 'test-env',
    sourceBundle: 'test.zip'
  }

  it('Should return error param missing `region`', function() {
    try {
      const input = {...opts, region: undefined}
      expect(setup(input)).to.be.empty;
    } catch(e) {
      expect(e.toString()).to.contain('Param missing [region]');
    }
  });

  it('Should return error param missing `applicationName`', function() {
    try {
      const input = {...opts, applicationName: undefined}
      expect(setup(input)).to.be.empty;
    } catch(e) {
      expect(e.toString()).to.contain('Param missing [applicationName]');
    }
  });

  it('Should return error param missing `environmentName`', function() {
    try {
      const input = {...opts, environmentName: undefined}
      expect(setup(input)).to.be.empty;
    } catch(e) {
      expect(e.toString()).to.contain('Param missing [environmentName]');
    }
  });

  it('Should return error param missing `sourceBundle`', function() {
    try {
      const input = {...opts, sourceBundle: undefined}
      expect(setup(input)).to.be.empty;
    } catch(e) {
      expect(e.toString()).to.contain('Param missing [sourceBundle]');
    }
  });

  it('Should return error invalid sourceBundle', function() {
    try {
      expect(setup(opts)).to.be.empty;
    } catch(e) {
      expect(e.toString()).to.contain('Invalid sourceBundle');
    }
  });

});
