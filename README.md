# mio-validators [![Build Status](https://img.shields.io/travis/mio/validators.svg?style=flat)](http://travis-ci.org/mio/validators) [![Coverage Status](https://img.shields.io/coveralls/mio/validators.svg?style=flat)](https://coveralls.io/r/mio/validators?branch=master) [![Bower version](https://img.shields.io/bower/v/mio-validators.svg?style=flat)](http://badge.fury.io/bo/mio) [![NPM version](https://img.shields.io/npm/v/mio-validators.svg?style=flat)](http://badge.fury.io/js/mio-validators)

Validators for [Mio][0] models.

## Installation

Using [npm][1]:

```sh
npm install --save mio-validators
```

Using [bower][2]:

```sh
bower install --save mio/validators
```

Using browser script tag and global (UMD wrapper):

```html
// Available via window.mio.validators
<script src="dist/mio-validators.js"></script>
```

## Usage

Only attributes that have values other than `null` or `undefined` are validated,
and those marked with `required: true` will return a validation error if their
value is `null` or `undefined`.

```javascript
var mio = require('mio');
var validators = require('mio-validators');

var User = mio.Resource.extend();

User
  .use(validators())
  .attr('id', {
    primary: true,
    constraints: [
      validators.Assert.TypeOf('string'),
      validators.Assert.Length({ min: 1, max: 32 })
    ]
  })
  .attr('name', {
    required: true,
    contraints: [
      validators.Assert.TypeOf('string'),
      validators.Assert.Length({ min: 2, max: 32 })
    ]
  })
  .attr('email', {
    required: true,
    constraints: [
      validators.Assert.Email()
    ]
  });
```

mio-validators uses [asserted](https://github.com/alexmingoia/asserted) for
assertions. Refer to the asserted documentation for information on available
assertions or creating custom assertions.

### "validate" hook

mio-validators adds a "validate" asynchronous event and calls its handlers in
series before save hooks.

### Resource#validate(callback)

**Params**

- callback `Function(ValidationError)`

### ValidationError

## MIT Licensed

[0]: https://github.com/mio/mio/
[1]: https://npmjs.org/
[2]: http://bower.io/
