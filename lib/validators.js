var Assert = require('asserted');

module.exports = Validators;

/**
 * Mio plugin function. Adds `Resource#validate()` method and adds hooks to
 * validate attributes with their specified constraints.
 *
 * @param {Resource} Resource
 */

function Validators (Resource) {
  if (!(this instanceof Validators)) {
    return new Validators(Resource);
  }

  this.Resource = Resource;
  this.constraints = {};

  Resource.prototype.validate = this.validate;

  for (var attr in Resource.attributes) {
    this.add(attr);
  }

  Resource.on('attribute', this.add);
  Resource.before('create update', this.beforeCreateOrUpdate);
  Resource.before('validate', this.beforeValidate);
};

/**
 * Add validators for given resource `attr`.
 *
 * @param {String} attr
 */

Validators.prototype.add = function (attr) {
  var options = this.Resource.attributes[attr];

  if (options.constraints) {
    this.constraints[attr] = options.constraints;
  }
};

/**
 * Runs validations for resource "create" and "update" events.
 *
 * @param {Resource} resource
 * @param {Object} changed
 * @param {Function(err)} next
 * @this {Resource}
 */

Validators.prototype.beforeCreateOrUpdate = function (resource, changed, next) {
  resource.validate(next);
};

/**
 * Validate method added to resource prototype.
 *
 * @param {Function(err)} done
 * @this {Resource}
 */

Validators.prototype.validate = function (done) {
  return this.constructor.run('validate', [this, this.changed()], done);
};

/**
 * Validate event handler. Runs assertions and passes error decorated with
 * violations to callback.
 *
 * @param {Resource} resource
 * @param {Object} changed
 * @param {Function(err)} next
 * @this {Resource}
 */

Validators.prototype.beforeValidate = function (resource, changed, next) {
  var attributes = resource.constructor.attributes;
  var violations = {};
  var error;

  for (var attr in changed) {
    var constraints = attributes[attr].constraints;

    if (constraints) {
      for (var i=0, l=constraints.length; i<l; i++) {
        var assertion = constraints[i](changed[attr]);

        if (!assertion.satisfied) {
          violations[attr] = violations[attr] || [];
          violations[attr].push(assertion.message);
        }
      }
    }
  }

  if (Object.keys(violations).length) {
    error = new Error("Validation(s) failed.");
    error.violations = violations;
  }

  next(error);
};

Validators.Assert = Assert;
