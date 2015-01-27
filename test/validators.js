var expect = require('chai').expect;
var mio = require('mio');
var Validators = process.env.JSCOV ? require('../lib-cov/validators') : require('../lib/validators');

describe('plugin', function() {
  it('exports Validators', function() {
    expect(Validators).to.be.a('function');
  });

  it('exports ValidationError', function() {
    expect(Validators.ValidationError).to.be.a('function');
    Validators.ValidationError();
  });
});

describe('Validators', function () {
  it('runs assertions before create', function (done) {
    var resource = mio.Resource.extend({
      attributes: {
        id: {
          primary: true
        },
        name: {
          constraints: [
            Validators.Assert.Type('string', 'test msg')
          ]
        }
      }
    }).use(Validators)().set({ name: 1 });

    resource.post(function(err) {
      expect(err).to.exist();
      expect(err).to.be.instanceOf(Validators.ValidationError);
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
      attributes: {
        id: {
          primary: true
        },
        name: {
          constraints: [
            Validators.Assert.Type('string')
          ]
        }
      },
    }, {
      use: [Validators]
    })({ id: 1 }).set({ name: 1 });

    resource.put(function(err) {
      expect(err).to.exist();
      done();
    });
  });

  it('only validates defined non-null attribute values', function (done) {
    var resource = mio.Resource.extend({
      attributes: {
        id: {
          primary: true
        },
        name: {
          constraints: [
            Validators.Assert.Type('string')
          ]
        },
        email: {
          constraints: [
            Validators.Assert.Type('string')
          ]
        }
      },
    }, {
      use: [Validators]
    })({ id: 1 }).set({ name: "alex", email: null });

    resource.patch(done)
  });

  it('validates extended resources', function (done) {
    var Base = mio.Resource.extend({
      attributes: {
        id: {
          primary: true
        },
        name: {
          constraints: [
            Validators.Assert.Type('string')
          ]
        },
        email: {
          constraints: [
            Validators.Assert.Type('string')
          ]
        }
      },
    }, {
      use: [Validators]
    });

    var Extended = Base.extend({
      attributes: {
        title: {
          required: true,
          constraints: [
            Validators.Assert.Type('string')
          ]
        }
      }
    });

    var resource = new Extended({ id: 1 });

    resource.post(function(err) {
      expect(err).to.exist();

      Extended.Collection.post([resource], function (err) {
        expect(err).to.exist();
        done();
      });
    })
  });

  it('returns error for missing required attributes', function (done) {
    var resource = mio.Resource.extend({
      attributes: {
        id: {
          primary: true
        },
        name: {
          constraints: [
            Validators.Assert.Type('string')
          ]
        },
        email: {
          required: true,
          constraints: [
            Validators.Assert.Type('string')
          ]
        }
      },
    }, {
      use: [Validators]
    })({ id: 1 }).set({ name: "alex", email: null });

    resource.put(function(err) {
      expect(err).to.exist();
      done();
    })
  });
});
