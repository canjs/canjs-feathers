'use strict';

(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['can/util/library', 'can/model', 'can/map'], factory);
    } else if (typeof exports === 'object') {
        module.exports = factory(require('can/util/library'), require('can/model'), require('can/map'));
    } else if(typeof window !== 'undefined' && root && root.can) {
        factory(root.can, root.can.Model, root.can.Map);
    }
}(this, function (can, Model, Map) {
    var stripSlashes = function (name) {
      return name.replace(/^\/|\/$/g, '');
    };

    var connection = new Map({});

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

          connection.bind('socket', function(ev, socket){
            // Set up listeners when a connection.socket is set.
            if (socket) {
              socket.on(resource + ' created', makeHandler('create'));
              socket.on(resource + ' updated', makeHandler('update'));
              socket.on(resource + ' removed', makeHandler('remove'));

            // Tear down old listeners when connection.socket is removed.
            } else {
              connection.attr('socket').removeAllListeners(resource + ' created')
              connection.attr('socket').removeAllListeners(resource + ' updated')
              connection.attr('socket').removeAllListeners(resource + ' removed')
            }
          });

          this.findAll = function (params) {
            return this.send('find', params || {});
          },

          this.findOne = function (params) {
            return this.send('get', params.id, params);
          },

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
          }

          deferred.resolve(data);
        });

        connection.attr('socket').emit.apply(socket, args);

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
        // If there's an existing socket...
        if (connection.attr('socket')) {
          // and disconnect the socket.
          connection.attr('socket').disconnect();

          // ... trigger removal of old listeners/handlers,
          connection.removeAttr('socket');
        };
        // Put the new socket in place.
        connection.attr('socket', socket);
      }
    };

    return can.Feathers;
}));
