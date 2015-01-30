!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),(o.mio||(o.mio={})).validators=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
  Resource.before('collection:post', this.post);

  Resource.before('validate', this.beforeValidate);
};

Validators.Assert = Assert;
Validators.ValidationError = ValidationError;

/**
 * Handler for 'put' and 'collection:put' hooks.
 *
 * @this {mio.Resource}
 */

Validators.prototype.put = function (query, representation, next, resource) {
  if (resource) {
    resource.validate(next);
  }
};

/**
 * Handler for 'patch' and 'collection:patch' hooks.
 *
 * @this {mio.Resource}
 */

Validators.prototype.patch = function (query, changes, next, resource) {
  if (resource) {
    resource.validate(next);
  }
};

/**
 * Handler for 'post' and 'collection:post' hooks.
 *
 * @this {mio.Resource}
 */

Validators.prototype.post = function (representation, next) {
  var Resource = this;
  var i = 0;

  function nextResource (err) {
    if (err) return next(err);

    i++;

    if (i < representation.length) {
      Resource.create(representation[i]).validate(nextResource);
    } else {
      next();
    }
  }

  if (representation instanceof Resource.Collection) {
    Resource.create(representation[i]).validate(nextResource);
  } else {
    Resource.create(representation).validate(next);
  }
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
  return this.trigger('validate', this.changed(), done);
};

/**
 * Validate event handler. Runs assertions and passes error decorated with
 * violations to callback.
 *
 * @param {Object} changed
 * @param {Function(err)} next
 * @param {mio.Resource} resource
 * @this {mio.Resource}
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

},{"asserted":2,"inherits":3}],2:[function(require,module,exports){
/*!
 * asserted
 * https://github.com/alexmingoia/asserted
 */

'use strict';

/**
 * A simple extensible interface for validation assertions shipped with the
 * minimum assertions necessary for robust validations.
 *
 * @module asserted
 * @alias Assert
 */

module.exports = Assert;

/**
 * Create a new assertion with given `value`.
 *
 * Check `Assert#satisfied` and if false a failure message will be available
 * via `Assert#message`.
 *
 * @param {Mixed} value
 * @param {String=} message override default message. %v is replaced with value
 * @return {Assert}
 * @alias module:asserted
 * @constructor
 */

function Assert (value, message) {
  if (!(this instanceof Assert)) {
    return new Assert(value, message);
  }

  this.value = value;
  this.satisfied = this.assert(value);
  this.message = this.format(message || this.message, value);
};

/**
 * Throw error if assert is used directly.
 *
 * @private
 */

Assert.prototype.assert = function () {
  throw new Error(
    "Assert is not meant to be used but extended with Assert.extend()"
  );
};

/**
 * Replace %v in `message` with `value`.
 *
 * @param {String} message
 * @param {Mixed} value
 * @return {String}
 * @private
 */

Assert.prototype.format = function (message, value) {
  var replacement = value.toString ? value.toString() : value;
  return message.replace(/%v/g, replacement);
};

/**
 * Extend Assert with given `message` and assertion `fn`.
 *
 * @param {String} message %v is replaced with asserted value
 * @param {Function(value)} fn assertion function returns boolean
 * @return {Assert}
 */

Assert.extend = function (message, fn) {
  var parent = this;

  var child = function assertion (value, message) {
    if (!(this instanceof assertion)) {
      return new assertion(value, message);
    }

    return parent.apply(this, arguments);
  };

  child.extend = parent.extend;

  var Surrogate = function() {
    this.constructor = child;
  };
  Surrogate.prototype = parent.prototype;
  child.prototype = new Surrogate();

  child.prototype.assert = fn;
  child.prototype.message = message;

  child.__super__ = parent.prototype;

  return child;
};

/**
 * Create assertion that value is type of given `type`.
 *
 * @param {String} type
 * @param {String=} message
 * @return {Assert}
 */

Assert.Type = function (type, message) {
  if (typeof type !== 'string') {
    throw new Error("type must be a string");
  }

  if (!message) {
    message= "`%v` is not of type " + type;
  }

  return this.extend(message, function (value) {
    return typeof value === type;
  });
};

/**
 * Create assertion that value is instance of given `constructor`.
 *
 * @param {Function} constructor
 * @param {String=} message
 * @return {Assert}
 */

Assert.Instance = function (constructor, message) {
  if (typeof constructor !== 'function') {
    throw new Error("constructor must be a function");
  }

  if (!message) {
    message = "`%v` is not an instance of " + constructor.name;
  }

  return this.extend(message, function (value) {
    return (value instanceof constructor);
  });
};

/**
 * Create assertion that value is equal to given `value`.
 *
 * @param {Mixed} value
 * @param {String=} message
 * @return {Assert}
 */

Assert.Equals = function (value, message) {
  var str = value.toString ? value.toString() : value;

  if (!message) {
    message = "`%v` is not equal to `" + str + "`";
  }

  return this.extend(message, function (subject) {
    return subject === value;
  });
};

/**
 * Create assertion that value is in given `set`.
 *
 * @param {Array} set
 * @param {String=} message
 * @return {Assert}
 */

Assert.Enum = function (set, message) {
  if (!(set instanceof Array) || !set.length) {
    throw new Error("enum set must be a non-empty array");
  }

  if (!message) {
    message = "`%v` is not one of " + JSON.stringify(set);
  }

  return this.extend(message, function (value) {
    return !!~set.indexOf(value);
  });
};

/**
 * Create assertion that value array members satisfy the given `assert`.
 *
 * @param {Assert} assert
 * @param {String=} message
 * @return {Assert}
 */

Assert.Set = function (assert, message) {
  if (typeof assert !== 'function' || !assert.prototype.assert) {
    throw new Error("set assertion must be an Assert");
  }

  return this.extend(message || assert.prototype.message, function (value) {
    if (!(value instanceof Array)) {
      return false;
    }

    for (var i=0, l=value.length; i<l; i++) {
      var assertion = assert(value[i]);

      if (!assertion.satisfied) {
        return false;
      }
    }

    return true;
  });
};

/**
 * Create assertion that number value is within given `range`.
 *
 * @param {Object} range
 * @param {Number} range.min
 * @param {Number} range.max
 * @param {String=} message
 * @return {Assert}
 */

Assert.Range = function (range, message) {
  if (!range || !range.min || !range.max) {
    throw new Error("range must be an object with min and max");
  }

  if (!message) {
    message = "`%v` is not a number between " + range.min + " and " + range.max;
  }

  return this.extend(message, function (value) {
    return typeof value === 'number' && value > range.min && value < range.max;
  });
};

/**
 * Create assertion that string or array value has given `length`.
 *
 * @param {Object|Number} length
 * @param {Number=} length.min
 * @param {Number=} length.max
 * @param {String=} message
 * @return {Assert}
 */

Assert.Length = function (length, message) {
  if (!message) {
    message = "`%v` must have a ";

    if (typeof length === 'number') {
      message += "length of " + length;
      length = { min: length, max: length };
    } else {
      if (length.min && length.max) {
        message += "minimum length of " + length.min + " and maximum length of "
                 + length.max;
      } else {
        if (length.min) {
          message += "minimum length of " + length.min;
        }
        if (length.max) {
          message += "maximum length of " + length.max;
        }
      }
    }
  }

  return this.extend(message, function (value) {
    if (typeof value !== 'string' && !(value instanceof Array)) {
      return false;
    }

    if (length.min && value.length < length.min) {
      return false;
    }

    if (length.max && value.length > length.max) {
      return false;
    }

    return true;
  });
};

/**
 * Create assertion that value matches given `regex`.
 *
 * @param {RegExp} regex
 * @param {String=} message
 * @return {Assert}
 */

Assert.RegExp = function (regex, message) {
  if (!message) {
    message = "`%v` does not match " + regex.toString();
  }

  return this.extend(message, function (value) {
    return regex.test(value);
  });
};

},{}],3:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}]},{},[1])(1)
});