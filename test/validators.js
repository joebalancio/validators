var expect = require('chai').expect;
var mio = require('mio');
var plugin = process.env.JSCOV ? require('../lib-cov/validators') : require('../lib/validators');

describe('validators', function() {
  it('exports plugin', function() {
    expect(plugin).to.be.a('function');
    expect(plugin()).to.be.a('function');
  });

  it('extends default validators', function(done) {
    var User = mio.createModel('user');
    var customValidator = function() {
      return function(model, changed, next) {
        next(new Error('test'));
      };
    };

    User
      .attr('name', { custom: true })
      .use(plugin({
        custom: customValidator
      }));

    User.create().save(function(err) {
      expect(err).to.have.property('message', 'test');
      done();
    });
  });

  describe('format', function() {
    it('calls next() if attribute is valid format', function() {
      var model = new (mio.createModel('test').attr('website', {
        format: 'url'
      }).use(plugin()))({ website: 'http://example.com' });
      model.save(function(err) {
        expect(err).to.equal(null);
      });
    });

    it('errors when attribute is invalid format', function() {
      var model = new (mio.createModel('test').attr('website', {
        format: 'url'
      }).use(plugin()))({ website: "example" });
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
      });
    });

    it('uses options.message for error message', function() {
      var model = new (mio.createModel('test').attr('website', {
        format: {
          url: "is not a valid url"
        }
      }).use(plugin()))({ website: "example" });
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err).to.have.property('message', 'is not a valid url');
      });
    });

    describe('email', function() {
      it('calls next() if attribute is valid email', function() {
        var model = new (mio.createModel('test').attr('email', {
          format: {
            email: {
              message: "invalid email"
            }
          }
        }).use(plugin()))({ email: 'test@example.com' });
        model.save(function(err) {
          expect(err).to.equal(null);
        });
      });

      it('errors when attribute is invalid email', function() {
        var model = new (mio.createModel('test').attr('email', {
          format: 'email'
        }).use(plugin()))({ email: "example" });
        model.save(function(err) {
          expect(err).to.be.an.instanceOf(Error);
        });
      });
    });
  });

  describe('instance', function() {
    it('calls next() if attribute is instance of', function() {
      var model = new (mio.createModel('test').attr('created_at', {
        instance: Date
      }).use(plugin()))({ created_at: new Date() });
      model.save(function(err) {
        expect(err).to.equal(null);
      });
    });

    it('errors when attribute is not an instance of', function() {
      var model = new (mio.createModel('test').attr('name', {
        instance: String
      }).use(plugin()))({ name: 1 });
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
      });
    });

    it('uses options.message for error message', function() {
      var model = new (mio.createModel('test').attr('name', {
        instance: {
          of: String,
          message: "Not instance of string!!"
        }
      }).use(plugin()))({ name: 1 });
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err).to.have.property('message', 'Not instance of string!!');
      });
    });
  });

  describe('required', function() {
    it('calls next if attribute is set', function() {
      var model = new (mio.createModel('test').attr('name', {
        required: true
      }).use(plugin()))({ name: 'alex' });
      model.save(function(err) {
        expect(err).to.equal(null);
      });
    });

    it('errors when attribute is missing', function() {
      var model = new (mio.createModel('test').attr('name', {
        required: true
      }).use(plugin()))();
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
      });
    });

    it('uses options.message for error message', function() {
      var model = new (mio.createModel('test').attr('name', {
        required: { message: "Name is required!!" }
      }).use(plugin()))();
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err).to.have.property('message', 'Name is required!!');
      });
    });
  });

  describe('type', function() {
    it('calls next() if attribute is type of', function() {
      var model = new (mio.createModel('test').attr('name', {
        type: 'string'
      }).use(plugin()))({ name: 'alex' });
      model.save(function(err) {
        expect(err).to.equal(null);
      });
    });

    it('errors when attribute is not a type of', function() {
      var model = new (mio.createModel('test').attr('name', {
        type: 'array'
      }).use(plugin()))({ name: 1 });
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
      });
    });

    it('uses options.message for error message', function() {
      var model = new (mio.createModel('test').attr('name', {
        type: {
          is: 'function',
          message: "Not a function!!"
        }
      }).use(plugin()))({ name: 1 });
      model.save(function(err) {
        expect(err).to.be.an.instanceOf(Error);
        expect(err).to.have.property('message', 'Not a function!!');
      });
    });
  });
});
