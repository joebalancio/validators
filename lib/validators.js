(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(['require', 'module', 'exports'], factory); /* AMD */
  } else if (typeof exports === 'object') {
    factory(require, module, exports); /* CommonJS */
  } else {
    throw new Error("mio-validators require AMD or CommonJS");
  }
})(this, function(require, module, exports) {

  var validators = {
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

  module.exports = plugin;
  exports.validators = validators;
});
