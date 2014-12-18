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

  var validators = this;

  this.Resource = Resource;
  this.constraints = {};

  Resource.prototype.validate = this.validate;

  Resource.before('put', this.put.bind(this));
  Resource.before('patch', this.patch.bind(this));
  Resource.before('post', this.post.bind(this));
  Resource.before('collection:put', this.put.bind(this));
  Resource.before('collection:patch', this.patch.bind(this));
  Resource.before('collection:post', this.post.bind(this));

  Resource.before('validate', this.beforeValidate);
};

Validators.Assert = Assert;
Validators.ValidationError = ValidationError;

Validators.prototype.put = function (query, representation, next, resource) {
  if (resource) {
    resource.validate(next);
  }
};

Validators.prototype.patch = function (query, changes, next, resource) {
  if (resource) {
    resource.validate(next);
  }
};

Validators.prototype.post = function (resource, next) {
  var validators = this;
  var i = 0;

  function nextResource (err) {
    if (err) return next(err);

    i++;

    if (i < resource.length) {
      validators.Resource.create(resource[i]).validate(nextResource);
    } else {
      next();
    }
  }

  if (Array.isArray(resource)) {
    this.Resource.create(resource[i]).validate(nextResource);
  } else {
    this.Resource.create(resource).validate(next);
  }
};

/**
 * Validate method added to resource prototype.
 *
 * @param {Function(err)} done
 * @this {Resource}
 * @fires before:validate
 * @fires validate
 */
Validators.prototype.validate = function (done) {

  /**
   * @event before:validate
   * @param {Resource} resource
   * @param {changed} Object
   * @param {Function} next
   */

  /**
   * @event validate
   * @param {Resource} resource
   * @param {changed} Object
   */
  return this.trigger('validate', this.changed(), done);
};

/**
 * Validate event handler. Runs assertions and passes error decorated with
 * violations to callback.
 *
 * @param {Object} changed
 * @param {Function(err)} next
 * @param {Resource} resource
 * @this {Resource}
 */
Validators.prototype.beforeValidate = function (changed, next, resource) {
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
