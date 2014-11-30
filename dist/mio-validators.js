!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),(o.mio||(o.mio={})).validators=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"asserted":2}],2:[function(require,module,exports){
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

},{}]},{},[1])(1)
});