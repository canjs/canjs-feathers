# canjs-feathers

[![Build Status](https://travis-ci.org/feathersjs/canjs-feathers.png?branch=master)](https://travis-ci.org/feathersjs/canjs-feathers)

A set of utils for using CanJS with Feathers client.

## Installation
```
npm install canjs-feathers --save
```

## Documentation
Please refer to the [Feathers + CanJS](http://docs.feathersjs.com/frameworks/canjs.html) page in the official Feathers docs.

> Note: The 1.0.0 version of `canjs-feathers` is only compatible with CanJS 3.0 and DefineMaps (the can-define plugin).

## Complete Example
Here's an example of setting up a feathers connection and Account Model for your CanJS application.
```js
import feathers from 'feathers/client';
import socketio from 'feathers-socketio/client';
import hooks from 'feathers-hooks';
import io from 'socket.io-client';
import rxjs from 'rxjs';
import rx from 'feathers-reactive';

const host = 'http://localhost:3030';
const socket = io(host, {
  transports: ['websocket'],
  forceReconnect: true
});
const app = feathers()
	// Use the feathers-reactive plugin for live-updating lists!
  .configure(rx(rxjs, {
    idField: '_id'
  }))
  .configure(hooks())
  .configure(socketio(socket));

// Model creation would usually go in its own file,
// but here it is inline for simplicity.
import DefineMap from 'can-define/map/';
import DefineList from 'can-define/list/';
import Connection from 'canjs-feathers';

// Define a Robot Model.
const Robot = DefineMap.extend('Robot', {
	seal: false
}, {
	'_id': '*',
	model: {type: 'string'}
});

// Define a Robot.List.
Robot.List = DefineList.extend({
	'*': Robot
});

// Combine the best of both CanJS and Feathers.
new Connection({
	service: app.service('v1/robots'),
	idProp: '_id',
	Map: Robot
});

// You can now use `find` directly from the Robot model.
Robot.find({model: 'T1000'}).then(response => {
	// The returned data will be a List (Observable array) of Robot instances.
	console.log(response);
});

// Using the service directly will also return Robot instances.
app.service('v1/robots').find({}).then(response => {
	console.log(response); // --> Robot instances!
});
```

## Usage

### ES6 use

With StealJS, you can import this module directly in a template that is autorendered:

```js
import plugin from 'canjs-feathers';
```

### CommonJS use

Use `require` to load `canjs-feathers` and everything else
needed to create a template that uses `canjs-feathers`:

```js
var plugin = require("canjs-feathers");
```

## AMD use

Configure the `can` and `jquery` paths and the `canjs-feathers` package:

```html
<script src="require.js"></script>
<script>
	require.config({
	    paths: {
	        "jquery": "node_modules/jquery/dist/jquery",
	        "can": "node_modules/canjs/dist/amd/can"
	    },
	    packages: [{
		    	name: 'canjs-feathers',
		    	location: 'node_modules/canjs-feathers/dist/amd',
		    	main: 'lib/canjs-feathers'
	    }]
	});
	require(["main-amd"], function(){});
</script>
```

### Standalone use

Load the `global` version of the plugin:

```html
<script src='./node_modules/canjs-feathers/dist/global/canjs-feathers.js'></script>
```

## Contributing

### Making a Build

To make a build of the distributables into `dist/` in the cloned repository run

```
npm install
node build
```

### Running the tests

Tests can run in the browser by opening a webserver and visiting the `test.html` page.
Automated tests that run the tests from the command line in Firefox can be run with

```
npm test
```

## License

Copyright (c) 2016, FeathersJS

Licensed under the [MIT license](LICENSE).
