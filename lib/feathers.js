'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define(['can/util/library', 'can/model', 'can/map', 'feathers-websocket-client'], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory(require('can/util/library'), require('can/model'), require('can/map'), require('feathers-websocket-client'));
  } else if(typeof window !== 'undefined' && root && root.can && root.FeathersClient) {
      factory(root.can, root.can.Model, root.can.Map, root.FeathersClient);
  }
}(this, function (can, Model, Map, feathersClient) {
  // The socket will be set up here to respond to changes.
  var connection = new Map({
    ready:new can.Deferred()
  });

  // A place to keep track of all connected resources.
  var resources = [];
  // When a new socket is set, each resource needs to have new handlers set up.
  // `resourceCount` is used to make sure all new listeners are in place before any
  // queries are sent off.
  var resourceCount = 0;

  // Creates a resource event handler function for a given event
  var makeHandler = function(ev) {
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

        // Don't trigger the create event on the model if it's
        // already in the model store, but still trigger other events.
        if (!(ev === 'create' && self.store[id])) {
          // Trigger the event from the resource as a model event
          var model = self.model(data);
          if(model[modelEvent]) {
            model[modelEvent]();
          }
        }
      }
    };
  };



  var SocketModel = Model.extend({
    // Here we store locks that prevent dispatching
    // created, updated and removed events multiple times
    _locks: {},
    connect: can.Deferred(),

    setup: function () {
      Model.setup.apply(this, arguments);

      if(this.resource) {

        var self = this;
        this.resource = feathersClient.stripSlashes(this.resource);

        // Add the resource to the `resources` list.
        resources.push(this.resource);

        var socket = connection.attr('socket');

        // connection.bind('socket', function(ev, socket){
          // Set up listeners when a connection.socket is set.
          // if (socket) {

            // Create the Feathers client for this model.
            self.client = feathersClient(self.resource, socket);

            socket.on(self.resource + ' created', makeHandler.call(self, 'create'));
            socket.on(self.resource + ' updated', makeHandler.call(self, 'update'));
            socket.on(self.resource + ' removed', makeHandler.call(self, 'remove'));

            resourceCount++;
            // When these are equal, all handlers have been set up. Resolve.
            if (resources.length === resourceCount) {
              connection.attr('ready').resolve(socket);
            };

          // Tear down old listeners when connection.socket is removed.
          // }
          // else {
          //   connection.attr('socket').off(resource + ' created')
          //   connection.attr('socket').off(resource + ' updated')
          //   connection.attr('socket').off(resource + ' removed')
          // }
        // });

        this.create = function (attrs, params) {
          var def = new can.Deferred();

          this.client.create(attrs, params || {}, function(err, data){
            self._locks[data[self.id]] = 'created';
            def.resolve(data);
          })

          return def;
        },

        this.update = function (id, attrs, params) {
          this._locks[id] = 'update';
          var def = new can.Deferred();

          this.client.update(id, attrs, params || {}, function(err, data){
            self._locks[data[self.id]] = self._locks[id] + 'd';
            def.resolve(data);
          })

          return def;
        },

        this.destroy = function (id, attrs, params) {
          this._locks[id] = 'remove';
          var def = new can.Deferred();

          this.client.remove(id, params || {}, function(err, data){
            self._locks[data[self.id]] = self._locks[id] + 'd';
            def.resolve(data);
          })

          return def;
        }
      }
    },

    // Uses this.makeFind() to create the Model's findAll().
    makeFindAll: function(){
      var self = this;
      return function(params, success, error){
        // A can.Deferred to send back.
        var def = can.Deferred();
        // Hook up success and error handlers
        def.then(success, error);
        // When the request comes back...
        self.client.find(params || {}, function(err, data){
          // If there was an error, reject the deferred.
          if (err) {
            def.reject(err);

          // Success, resolve the deferred with the data.
          } else {
            def.resolve(self.models(data));
          }
        });
        return def;
      };
    },

    // Uses this.makeFind() to create the Model's findOne().
    makeFindOne: function(){
      var self = this;
      return function(params, success, error){
        // A can.Deferred to send back.
        var def = can.Deferred();
        // Hook up success and error handlers
        def.then(success, error);
        // When the request comes back...
        self.client.get(params.id, params, function(err, data){
          // If there was an error, reject the deferred.
          if (err) {
            def.reject(err);

          // Success, resolve the deferred with the data.
          } else {
            def.resolve(self.model(data));
          }
        });
        return def;
      };
    },

    // send: function () {
    //   var deferred = can.Deferred();
    //   var args = can.makeArray(arguments);
    //   var name = args[0];
    //   var self = this;

    //   // Turn something like 'find' into todos::find
    //   args[0] = feathersClient.stripSlashes(this.resource) + '::' + name;

    //   // Add the success callback which just resolves or fails the Deferred
    //   args.push(function (error, data) {
    //     if (error) {
    //       return deferred.reject(error);
    //     }

    //     // Set the lock so that we don't dispatch duplicate events
    //     if(name === 'create' || name === 'remove' || name === 'update') {
    //       self._locks[data[self.id]] = name + 'd';
    //     } else if (name === 'find') {
    //       data = self.models(data);
    //     } else {
    //       data = self.model(data);
    //     }

    //     deferred.resolve(data);
    //   });

    //   connection.attr('ready').done(function(socket){
    //     socket.emit.apply(socket, args);
    //   });

    //   return deferred;
    // }
  }, {});




  can.Feathers = {
    Model: SocketModel,

    model: function (resource) {
      return SocketModel.extend({
        resource: resource
      }, {});
    },

    connect: function(socket) {
      // socket is required.
      if (!socket) {
        console.error('You must pass a socket to can.Feathers.connect(socket).');
        return false;
      }

      // If there's an existing socket...
      if (connection.attr('socket')) {
        // ... disconnect it.
        // connection.attr('socket').disconnect();
        // ... trigger removal of old listeners,
        // connection.removeAttr('socket');
        // Reset the resourceCount.
        // resourceCount = 0;
      }

      // Create a new deferred.
      connection.attr('ready', new can.Deferred());

      var def = new can.Deferred();

      // Put the new socket in place.
      connection.attr('socket', socket);

      // Resolve the deferred
      def.resolve(socket);

      // Return the deferred.
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
