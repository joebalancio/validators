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

  Resource.before('create', this.beforeCreateOrUpdate);
  Resource.before('update', this.beforeCreateOrUpdate);
  Resource.before('validate', this.beforeValidate);
};

Validators.Assert = Assert;
Validators.ValidationError = ValidationError;

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

  // validate each attribute
  for (var attr in attributes) {
    var value = resource[attr];
    var required = attributes[attr].required;
    var constraints = attributes[attr].constraints;

    // required option can be boolean or custom violation message
    if (typeof required === 'boolean') {
      required = attr + " is required";
    }

    // only validate attributes with a value other than null or undefined
    if (value === undefined || value === null) {
      if (required) {
        violations[attr] = violations[attr] || [];
        violations[attr].push(required);
      }
    } else if (constraints) {
      for (var i=0, l=constraints.length; i<l; i++) {
        var assertion = constraints[i](resource[attr]);

        if (!assertion.satisfied) {
          violations[attr] = violations[attr] || [];
          violations[attr].push(assertion.message);
        }
      }
    }
  }

  if (Object.keys(violations).length) {
    next(new ValidationError("Validation(s) failed.", violations));
  } else {
    next();
  }
};

/**
 * Create a new validation error from given `message` and `violations` map.
 *
 * @param {String} message
 * @param {Object} violations
 * @return {ValidationError}
 * @constructor
 */

function ValidationError (message, violations) {
  if (!(this instanceof ValidationError)) {
    return new ValidationError(message, violations);
  }

  this.name = "ValidationError";
  this.message = message;
  this.violations = violations;
  this.stack = (new Error()).stack;
}

ValidationError.prototype = new Error;
