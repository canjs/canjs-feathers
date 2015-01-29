'use strict';

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
      define(['can/util/library', 'can/model'], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory(require('can/util/library'), require('can/model'));
  } else if(typeof window !== 'undefined' && root && root.can) {
      factory(root.can, root.can.Model);
  }
}(this, function (can, Model) {
  var stripSlashes = function (name) {
    return name.replace(/^\/|\/$/g, '');
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
        var resource = stripSlashes(this.resource);

        // Creates a resource event handler function for a given event
        var makeHandler = function(ev) {
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

        this.connect.done(function(socket) {
          socket.on(resource + ' created', makeHandler('create'));
          socket.on(resource + ' updated', makeHandler('update'));
          socket.on(resource + ' removed', makeHandler('remove'));
        });

        this.create = function (attrs, params) {
          return this.send('create', attrs, params || {});
        },

        this.update = function (id, attrs, params) {
          var ev = this._locks[id] = 'update';
          return this.send(ev, id, attrs, params || {});
        },

        this.destroy = function (id, attrs, params) {
          var ev = this._locks[id] = 'remove';
          return this.send(ev, id, params || {});
        }
      }
    },

    // A utility function used by this.makeFindAll() and this.makeFindOne()
    makeFind:function(request){
      return function(params, success, error){
        // A can.Deferred to send back.
        var def = can.Deferred();
        // Hook up success and error handlers
        def.then(success, error);
        // When the request comes back...
        request.call(this, params).then(function(reqData){
          // ...resolve the can.Deferred with the data.
          def.resolve(reqData);
        }, function(failData){
          // ... or reject with failure data.
          def.reject(failData);
        });
        return def;
      };
    },

    // Uses this.makeFind() to create the Model's findAll().
    makeFindAll: function(){
      return this.makeFind(function(params){
        return this.send('find', params || {});
      });
    },

    // Uses this.makeFind() to create the Model's findOne().
    makeFindOne: function(){
      return this.makeFind(function(params){
        return this.send('get', params.id, params);
      });
    },

    send: function () {
      var deferred = can.Deferred();
      var args = can.makeArray(arguments);
      var name = args[0];
      var self = this;

      // Turn something like 'find' into todos::find
      args[0] = stripSlashes(this.resource) + '::' + name;

      // Add the success callback which just resolves or fails the Deferred
      args.push(function (error, data) {
        if (error) {
          return deferred.reject(error);
        }

        // Set the lock so that we don't dispatch duplicate events
        if(name === 'create' || name === 'remove' || name === 'update') {
          self._locks[data[self.id]] = name + 'd';
        } else if (name === 'find') {
          data = self.models(data);
        } else {
          data = self.model(data);
        }

        deferred.resolve(data);
      });

      this.connect.done(function(socket) {
        socket.emit.apply(socket, args);
      });

      return deferred;
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
      var dfd = SocketModel.connect;

      if(socket && dfd.state() !== 'resolved') {
        dfd.resolve(socket);
      } else if(socket) {
        throw new Error('There already seems to be a socket connection.');
      }

      return dfd;
    }
  };

  return can.Feathers;
}));
