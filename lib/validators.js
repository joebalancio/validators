var Assert = require('asserted');
var inherits = require('inherits');

module.exports = Validators;

/**
 * Mio plugin function. Adds `Resource#validate()` method and adds hooks to
 * validate attributes with their specified constraints.
 *
 * @param {mio.Resource} Resource
 */

function Validators (Resource) {
  if (!(this instanceof Validators)) {
    return new Validators(Resource);
  }

  var validators = this;

  this.Resource = Resource;
  this.constraints = {};

  Resource.prototype.validate = this.validate;

  Resource.before('put', this.put);
  Resource.before('patch', this.patch);
  Resource.before('post', this.post);
  Resource.before('collection:put', this.put);
  Resource.before('collection:patch', this.patch);
  Resource.before('collection:post', this.collectionPost);

  Resource.before('validate', this.beforeValidate);
};

Validators.Assert = Assert;
Validators.ValidationError = ValidationError;

/**
 * Handler for 'put' and 'collection:put' hooks.
 *
 * @this {mio.Resource}
 */

Validators.prototype.put = function (query, representation, next) {
  this.create(representation).validate(next);
};

/**
 * Handler for 'patch' and 'collection:patch' hooks.
 *
 * @this {mio.Resource}
 */
Validators.prototype.patch = function (query, representation, next) {
  var attributes = {};

  // only validate attributes in representation because PATCH receives a partial
  // representation of the resource. For example, we do not want to validate an
  // attribute as required if it is not included in the patch.
  for (var key in representation) {
    if (this.attributes[key]) {
      attributes[key] = this.attributes[key];
    }
  }

  Validators.validate(attributes, representation, next);
};

/**
 * Handler for 'post' hook.
 *
 * @this {mio.Resource}
 */

Validators.prototype.post = function (representation, next) {
  this.create(representation).validate(next);
};

/**
 * Handler for 'collection:post' hook.
 *
 * @this {mio.Resource}
 */
Validators.prototype.collectionPost = function (representation, next) {
  var Resource = this;
  var resources = representation.resources || representation;
  var i = 0;

  function nextResource (err) {
    if (err) return next(err);

    i++;

    if (i < representation.length) {
      Resource.create(resources[i]).validate(nextResource);
    } else {
      next();
    }
  }

  Resource.create(resources[i]).validate(nextResource);
};

/**
 * Validate method added to resource prototype.
 *
 * @param {Function(err)} done
 * @this {mio.Resource}
 * @fires before:validate
 * @fires validate
 */

Validators.prototype.validate = function (done) {

  /**
   * @event before:validate
   * @param {mio.Resource} resource
   * @param {changed} Object
   * @param {Function} next
   */

  /**
   * @event validate
   * @param {mio.Resource} resource
   * @param {changed} Object
   */
  return this.trigger('validate', this, done);
};

Validators.validate = function (attributes, values, done) {
  var violations = {};

  // validate each attribute
  for (var attr in attributes) {
    var value = values[attr];
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
        var assertion = constraints[i](values[attr]);

        if (!assertion.satisfied) {
          violations[attr] = violations[attr] || [];
          violations[attr].push(assertion.message);
        }
      }
    }
  }

  if (Object.keys(violations).length) {
    done(new ValidationError("Validation(s) failed.", violations));
  } else {
    done();
  }
};

/**
 * Validate event handler. Runs assertions and passes error decorated with
 * violations to callback.
 *
 * @param {Object} values
 * @param {Function(err)} next
 * @this {mio.Resource}
 */

Validators.prototype.beforeValidate = function (values, next) {
  Validators.validate(this.attributes, values, next);
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
  for (var key in violations) {
    for (var i = 0, l = violations[key].length; i < l; i++) {
      message += '\n\t- ' + violations[key][i];
    }
  }

  var err = new Error(message);
  err.name = "ValidationError";
  err.violations = violations;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(err, ValidationError);
  }

  err.__proto__ = ValidationError.prototype;

  return err;
}

inherits(ValidationError, Error);

ValidationError.prototype.toJSON = function () {
  return {
    name: this.name,
    message: this.message,
    violations: this.violations,
    stack: this.stack
  };
};
