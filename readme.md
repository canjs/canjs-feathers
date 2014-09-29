# CanJS Feathers [![Build Status](https://travis-ci.org/feathersjs/canjs-feathers.png?branch=master)](https://travis-ci.org/feathersjs/canjs-feathers)

> CanJS model implementation that connects to Feathers services through a real-time socket.

## Getting Started

The easiest way to obtain the plugin is through Bower:

> bower install canjs-feathers

Or [download the JavaScript]() and put it in your CanJS project folder.

To use it, you first need to make a connection to your socket server.  Make sure you already have your socket script loaded.  Here are some example connections:

```js

// Example socket connection. Connect to the current host via SocketIO
var socket = io();

// Example socket connection. Connect to todos.feathersjs.com
var socket = io('http://todos.feathersjs.com');

// Example socket connection. Connect to current host with custom token auth and transports.
var socket = io('',{
  query: 'token=<custom-token-here>',
  transports:['websocket']
});

// Example socket connection. Connect to my.app.com using Primus
var socket = Primus.connect('ws://my.app.com');


// Once you have connected, you use that socket connection like this:
can.Feathers.connect(socket);

```

To create a model you can use the shorthand `can.Feathers.model`:

```js
// connects to the todos service
var Todo = can.Feathers.model('/todos');
```

Or extend `can.Feathers.Model` and set the `resource` static property:

```js
var Todo = can.Feathers.Model.extend({
  resource: 'todos'
}, {});
```

Now you can use it like any other [CanJS](http://canjs.com/docs/can.Model.html) model:

```js
var todo = new Todo({ description: 'You have to do dishes' });

todo.save();

Todo.findAll().then(function(todos) {
  console.log(todos);
});
```

## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2014 David Luecke

Licensed under the [MIT license](LICENSE).
