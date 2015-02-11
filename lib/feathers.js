'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define(['can/util/library', 'can/model', 'can/map', 'feathers-websocket-client'], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory(require('can/util/library'), require('can/model'), require('can/map'), require('feathers-websocket-client'));
  } else if(typeof window !== 'undefined' && root && root.can && root.Feathers.client) {
      factory(root.can, root.can.Model, root.can.Map, root.Feathers.client);
  }
}(this, function (can, Model, Map, feathersClient) {

  var connection = new Map({
    // The socket is set up here to respond to changes.
    socket:{}
  });

  var SocketModel = Model.extend({
    // Here we store locks that prevent dispatching
    // created, updated and removed events multiple times
    _locks: {},
    ready: new can.Deferred(),

    setup: function () {
      var self = this;
      Model.setup.apply(this, arguments);

      // Resource is required.
      if (!this.resource) {
        return false;
      }

      this.makeClient();

      this.create = function (attrs, params) {
        return this.send('create', null, attrs, params || {});
      };

      this.update = function (id, attrs, params) {
        this._locks[id] = 'update';
        return this.send('update', id, attrs, params || {});
      };

      this.destroy = function (id, attrs, params) {
        this._locks[id] = 'remove';
        return this.send('remove', id, params || {});
      };

      // If the socket changes, update the internal Feathers client.
      connection.bind('socket', function(ev, socket){
        if (socket) {
          self.ready = new can.Deferred();
          self.makeClient();
        }
      });
    },

    // Processes request for create, update, and destroy
    send: function () {
      var self = this,
        deferred = can.Deferred(),
        args = can.makeArray(arguments),
        name = args.shift();

      // Name doesn't use id.
      if (name == 'create') {
        args.splice(0, 1);
      }

      // Add the success callback which just resolves or fails the Deferred
      args.push(function (error, data) {
        if (error) {
          return deferred.reject(error);
        }
        self._locks[data[self.id]] = name + 'd';
        deferred.resolve(data);
      });

      this.ready.then(function(){
        // Send the request.
        self.client[name].apply(self.client, args);
      });

      return deferred;
    },

    // A utility function used by this.makeFindAll() and this.makeFindOne()
    makeFind:function(name){
      var self = this;
      return function(params, success, error){
        // A can.Deferred to send back.
        var def = can.Deferred();
        // The method to be used for converting to models.
        var method = 'models';
        // Add params to args.
        var args = [params || {}];

        // Add the callback to args.
        args[1] = function(err, data){
          if (err) {
            return def.reject(err);
          }
          def.resolve(self[method](data));
        };
        // Add the id for get requests.
        if (name === 'get') {
          args.unshift(params.id);
          method = 'model';
        }
        // Hook up success and error handlers
        def.then(success, error);

        self.ready.then(function(){
          // Send the request.
          self.client[name].apply(self.client, args);
        });
        return def;
      };
    },


    // Uses this.makeFind() to create the Model's findAll().
    makeFindAll: function(){
      return this.makeFind('find');
    },

    // Uses this.makeFind() to create the Model's findOne().
    makeFindOne: function(){
      return this.makeFind('get');
    },

    makeClient: function(){
      var socket = connection.attr('socket');

      var events = ['create', 'update', 'remove'];

      // If we already have event handlers, turn them off.
      if (this.hasHandlers) {
        for (var i = 0; i < events.length; i++) {
          this.client.off(events[i] + 'd', this.makeHandler(events[i]));
        }
      }

      // Create the Feathers client for this model.
      this.client = feathersClient(this.resource, socket);

      // Setup new event handlers.
      for (var i = 0; i < events.length; i++) {
        this.client.on(events[i] + 'd', this.makeHandler(events[i]));
      }

      this.ready.resolve();

      this.hasHandlers = true;
    },

    // Creates a resource event handler function for a given event
    makeHandler: function(ev) {
      var self = this;
      return function(data) {
        var id = data[self.id];

        // Check if this id is locked and contains e.g. a 'created'
        // Which means that we are getting the duplicate event from the
        // Socket remove the lock but don't dispatch the event
        if(self._locks[id] === ev + 'd') {
          delete self._locks[id];

        // If we are currently updating or removing we ignore all
        // other resource events for this model instance
        } else if(self._locks[id] !== ev) {

          // Mapping from CanJS to Feathers event name
          var modelEvent = ev === 'remove' ? 'destroyed' : ev + 'd';

          // Only trigger 'create' if the model isn't in the store already.
          if (!(ev === 'create' && self.store[id])) {

            // Trigger the event from the resource as a model event
            var model = self.model(data);
            if(model[modelEvent]) {
              model[modelEvent]();
            }
          }
        }
      };
    }

  }, {});




  can.Feathers = {
    Model: SocketModel,

    model: function (resource) {
      return SocketModel.extend({
        resource: resource
      }, {});
    },

    connect: function(socket) {
      var self = this;

      // socket is required.
      if (!socket) {
        console.error('You must pass a socket to can.Feathers.connect(socket).');
        return false;
      }
      var def = new can.Deferred();

      // Sets up all current and future models to use the provided socket.
      function useSocket(socket){
        // Disconnect the old socket.
        var old = connection.attr('socket');
        if (old && old.disconnect) {
          connection.attr('socket').disconnect();
        }
        // Remove the old socket.
        connection.removeAttr('socket');

        // Set up the new socket.
        connection.attr('socket', socket);

        self.socketID = socket.id;

        def.resolve(socket);
      };

      // If the socket is connected...
      if(socket.connected){
        // ...and it's the same socket
        if (this.socketID === socket.id) {
          // resolve the def with it.
          def.resolve(socket);

        // If it's not the same socket, use it.
        } else {
          useSocket(socket);
        }
      } else {
        // Otherwise, wait for a connect event to fire.
        socket.on('connect', function() {
          useSocket(socket);
        });
      }

      return def;
    },

    disconnect:function(){
      if (connection.attr('socket')) {
        connection.attr('socket').disconnect();
      }
    }
  };
  return can.Feathers;
}));
