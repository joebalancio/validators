# mio-validators

[![Build Status](https://secure.travis-ci.org/mio/validators.png)](http://travis-ci.org/mio/validators) 
[![Coverage Status](https://coveralls.io/repos/mio/validators/badge.png?branch=master)](https://coveralls.io/r/mio/validators?branch=master)
[![Bower version](https://badge.fury.io/bo/mio-validators.png)](http://badge.fury.io/bo/mio-validators)
[![NPM version](https://badge.fury.io/js/mio-validators.png)](http://badge.fury.io/js/mio-validators)
[![Dependency Status](https://david-dm.org/mio/validators.png)](http://david-dm.org/mio/validators)

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

## Usage

```javascript
var mio = require('mio');
var validators = require('mio-validators');

var User = mio.createModel('user');

User
  .use(validators())
  .attr('id', {
    type: 'number',
    primary: true
  })
  .attr('name', {
    type: 'string',
    required: true
  });
```

## Validators

### format

```javascript
User.attr('website', {
  format: 'url'
});

// custom message
User.attr('phone', {
  format: {
    phone: "Must be a valid phone number!"
  }
});
```

### instance

```javascript
User.attr('created_at', {
  instance: Date
});

// custom message
User.attr('created_at', {
  instance: {
    of: Date,
    message: "Must be instance of Date!"
  }
});
```

### required

```javascript
User.attr('name', {
  required: true
});

// custom message
User.attr('name', {
  required: {
    message: "Name is required!"
  }
});
```

### type

```javascript
User.attr('name', {
  type: 'string'
});

// custom message
User.attr('name', {
  type: {
    is: 'string',
    message: "Name must be a string!"
  }
});
```

## MIT Licensed

[0]: https://github.com/mio/mio/
[1]: https://npmjs.org/
[2]: http://bower.io/
