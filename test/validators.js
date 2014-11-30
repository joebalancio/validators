var expect = require('chai').expect;
var mio = require('mio');
var Validators = process.env.JSCOV ? require('../lib-cov/validators') : require('../lib/validators');

describe('plugin', function() {
  it('exports Validators', function() {
    expect(Validators).to.be.a('function');
  });
});

describe('Validators', function () {
  it('runs assertions before create', function (done) {
    var resource = mio.Resource.extend({
      id: {
        primary: true
      },
      name: {
        constraints: [
          Validators.Assert.Type('string', 'test msg')
        ]
      }
    }).use(Validators)().set({ name: 1 });

    resource.save(function(err) {
      expect(err).to.exist();
      expect(err).to.be.instanceOf(Error);
      expect(err).to.have.property('violations');
      expect(err.violations).to.have.property('name');
      expect(err.violations.name).to.have.property('length', 1);
      expect(err.violations.name[0]).to.equal('test msg');
      done();
    })
  });

  it('runs assertions before update', function (done) {
    var resource = mio.Resource.extend({
      id: {
        primary: true
      },
      name: {
        constraints: [
          Validators.Assert.Type('string')
        ]
      }
    }).use(Validators)({ id: 1 }).set({ name: 1 });

    resource.save(function(err) {
      expect(err).to.exist();
      done();
    })
  });
});
