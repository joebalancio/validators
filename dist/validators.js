
(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require, exports, module);
  } else {
    root.mio.validators = factory();
  }
}(this, function(require, exports, module) {

return /**
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
;

}));
