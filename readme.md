# canjs-feathers

[![Build Status](https://travis-ci.org/feathersjs/canjs-feathers.png?branch=master)](https://travis-ci.org/feathersjs/canjs-feathers)

A set of utils for using CanJS with Feathers on the client.

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
