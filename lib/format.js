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
