# CanJS Feathers [![Build Status](https://travis-ci.org/feathersjs/canjs-feathers.png?branch=master)](https://travis-ci.org/feathersjs/canjs-feathers)

> CanJS model implementation that connects to Feathers services through a real-time socket.

## Getting Started

The easiest way to obtain the plugin is through Bower:

> bower install canjs-feathers

Or [download the JavaScript](/feathersjs/feathers-websocket-client/archive/master.zip) and put it in your CanJS project folder.

### Connect to the socket

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
```

### Pass the socket to can.Feathers.connect();

```js
// Once connected, you use that socket connection like this:
can.Feathers.connect(socket);

// Connect returns a deferred, so you can also do this:
can.Feathers.connect(socket).then(function(){
    // Do stuff here.
});
```


### Create Models
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

## Changing Sockets
As of version 2.1, it is possible to switch sockets after connecting.  This is valuable for apps that need real-time communication both before and after authentication.  Here is an example of switching sockets:

```js
// Connect without authentication...
var socket = io('', {transports: ['websocket'] });
can.Feathers.connect(socket);

Todo.findAll({}) // gets public todos


// Then later, with authentication...
socket = io('', {
    // An example of reading a token from localStorage.
    query: 'token=' + localStorage.getItem('featherstoken'),
    transports: ['websocket'],
    forceNew:true, // this is required
});
can.Feathers.connect(socket);

Todo.findAll({}) // Gets public todos and potentially private todos,
                 // depending on how your server is set up.
```

**Please note that `{forceNew:true}` is required when reconnecting.**


## Author

- [David Luecke](https://github.com/daffl)

## License

Copyright (c) 2014 David Luecke

Licensed under the [MIT license](LICENSE).
