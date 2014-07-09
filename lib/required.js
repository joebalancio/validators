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
