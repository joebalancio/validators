!function(e){if("object"==typeof exports&&"undefined"!=typeof module)module.exports=e();else if("function"==typeof define&&define.amd)define([],e);else{var o;"undefined"!=typeof window?o=window:"undefined"!=typeof global?o=global:"undefined"!=typeof self&&(o=self),(o.mio||(o.mio={})).validators=e()}}(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/**
 * Mio plugin factory.
 *
 * @param {Object?} extend extend default validators
 * @return {Function}
 * @api public
 */

module.exports = function createPlugin (extend) {
  var validators = {
    format: require('./format'),
    instance: require('./instance'),
    required: require('./required'),
    type: require('./type')
  };

  if (typeof extend === 'object') {
    for (var key in extend) {
      if (extend.hasOwnProperty(key)) {
        validators[key] = extend[key];
      }
    }
  }

  return function validatorsPlugin (Model) {
    function addValidators (name) {
      var options = Model.attributes[name];

      Object.keys(options).forEach(function(key) {
        var validator = validators[key];
        var validatorOpts = options[key];
        if (validator) {
          Model.before('save', validator(name, validatorOpts));
        }
      });
    };

    Model.on('attribute', addValidators);
    Object.keys(Model.attributes).forEach(addValidators);
  };
};

},{"./format":2,"./instance":3,"./required":4,"./type":5}],2:[function(require,module,exports){
module.exports = function(attr, options) {
  var formats = {};

  if (typeof options === 'string') {
    formats[options] = options;
  } else {
    formats = options;
  }

  return function(model, changed, next) {
    if (model[attr]) {
      for (var format in formats) {
        var message = formats[format];
        if (formats[format].message) {
          message = formats[format].message;
        }
        if (check[format] && !check[format](model[attr])) {
          message = message || attr + " is invalid.";
          return next(new Error(message));
        }
      }
    }

    next();
  };
};

var check = exports.formats = {
  // Email validation function is copyright(c) 2013 John Henry
  // https://github.com/johnhenry/valid-email/blob/master/lib/valid-email.js
  email: function(email) {
    var at = email.search("@");
    if (at <0) return false;
    var user = email.substr(0, at);
    var domain = email.substr(at+1);
    var userLen = user.length;
    var domainLen = domain.length;
    if (userLen < 1 || userLen > 64) return false;// user part length exceeded
    if (domainLen < 1 || domainLen > 255) return false;// domain part length exceeded
    if (user.charAt(0) === '.' || user.charAt(userLen-1) === '.') return false;// user part starts or ends with '.'
    if (user.match(/\.\./)) return false;// user part has two consecutive dots
    if (!domain.match(/^[A-Za-z0-9.-]+$/)) return false;// character not valid in domain part
    if (domain.match( /\\.\\./)) return false;// domain part has two consecutive dots
    if (!user.replace("\\\\","").match(/^(\\\\.|[A-Za-z0-9!#%&`_=\\/$\'*+?^{}|~.-])+$/)) if (!user.replace("\\\\","").match(/^"(\\\\"|[^"])+"$/)) return false
    return true;
  },
  phone: function(phone) {
    return (/^(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?$/).test(phone);
  },
  // from http://stackoverflow.com/a/190405
  url: function(url) {
    return (/^(?:(?:https?|ftp):\/\/)(?:\S+(?::\S*)?@)?(?:(?!10(?:\.\d{1,3}){3})(?!127(?:\.‌​\d{1,3}){3})(?!169\.254(?:\.\d{1,3}){2})(?!192\.168(?:\.\d{1,3}){2})(?!172\.(?:1[‌​6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1‌​,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00‌​a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u‌​00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:\/[^\s]*)?$/i).test(url);
  }
};

},{}],3:[function(require,module,exports){
module.exports = function(attr, options) {
  var instance = options.of || options;
  var message = options.message;

  if (!message) {
    message = attr + " is not an instance of " + instance.name + ".";
  }

  return function(model, changed, next) {
    var err;
    if (!(model[attr] instanceof instance)) {
      err = new Error(message);
    }
    next(err);
  };
};

},{}],4:[function(require,module,exports){
module.exports = function(attr, options) {
  var message = attr + " is required.";

  if (typeof options === 'object' && options.message) {
    message = options.message;
  }

  return function(model, changed, next) {
    var err;
    if (!model[attr] && model[attr] !== 0) {
      err = new Error(message);
    }
    next(err);
  };
};

},{}],5:[function(require,module,exports){
module.exports = function(attr, options) {
  var type = options.is || options;
  var message = options.message || attr + " is not a " + type + ".";

  return function(model, changed, next) {
    var err;
    if (typeOf(model[attr]) !== type) {
      err = new Error(message);
    }
    next(err);
  };
};

function typeOf(val) {
  switch (Object.prototype.toString.call(val)) {
    case '[object Function]': return 'function';
    case '[object Date]': return 'date';
    case '[object RegExp]': return 'regexp';
    case '[object Arguments]': return 'arguments';
    case '[object Array]': return 'array';
  }

  if (val === null) return 'null';
  if (val === undefined) return 'undefined';
  if (val === Object(val)) return 'object';

  return typeof val;
};

},{}]},{},[1])(1)
});