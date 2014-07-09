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
