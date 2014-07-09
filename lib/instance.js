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
