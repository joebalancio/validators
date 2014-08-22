module.exports = plugin;

var validators = exports.validators = {
  format: require('./format'),
  instance: require('./instance'),
  required: require('./required'),
  type: require('./type')
};

/**
 * Mio plugin factory.
 *
 * @return {Function}
 * @api public
 */

function plugin() {
  return function(Model) {
    Model.on('attribute', addValidators);
    Object.keys(Model.attributes).forEach(addValidators.bind(Model));
  };
};

function addValidators(name) {
  var Model = this;
  var options = Model.attributes[name];

  Object.keys(options).forEach(function(key) {
    var validator = validators[key];
    var validatorOpts = options[key];
    if (validator) {
      Model.before('save', validator(name, validatorOpts));
    }
  });
};