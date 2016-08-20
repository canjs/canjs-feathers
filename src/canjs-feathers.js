import canEvent from 'can-event';
import hydrate from './hooks/hydrate/';
import cache from './hooks/cache/';
import translateIds from './hooks/translate-ids/';
import deepAssign from 'can-util/js/deep-assign/deep-assign';

export default function ObservableService(options = {}){
  if (!options.Map) {
    throw new Error('Please provide a Map Constructor.');
  }
  if (!options.Map.List && !options.List) {
    throw new Error('Please provide a List Constructor.');
  }
  if (!options.service) {
    throw new Error('Please provide a feathers service.');
  }

  let name = options.name || options.Map.constructor.prototype.name;
  if (name === 'Map') {
    if(steal){
      steal.dev.log('Debugging will be easier if you give your Map a name.');
    }
  }

  const service = options.service;
  delete options.service;

  if (!service.before || !service.after) {
    throw new Error('The feathers-hooks plugin is required.');
  }

  // If provided, flatten the cache object into the options.
  if (options.cache) {
    options.cacheService = options.cache.service;
    options.cacheIdProp = options.cache.cacheIdProp;
  }

  const Map = options.Map;
  const List = Map.List || options.List;
  const defaults = {
    idProp: '_id',
    modelName: name,
    Map,
    List,
    modelStore: {}
  };
  Object.assign(service, defaults, options);

  // store a reference to the original newInstance function
  var _newInstance = Map.newInstance;

  // override the Map's newInstance function
  Map.newInstance = function(props) {
    let id = props[service.idProp];

    // If there's an id, look in the service.modelStore to see if the object already exists
    if (id) {
      var cachedInst = service.modelStore[id];
      if(cachedInst) {
        cachedInst = deepAssign(cachedInst, props);
        return cachedInst;
      }
    }

    // There was no id, call the original newInstance function and return a new
    // instance of Person.
    var newInst = _newInstance.apply(this, arguments);
    if (id) {
      service.modelStore[id] = newInst;
    }
    return newInst;
  };

  // Extend the Map
  Object.assign(Map, {
    idProp: service.idProp,

    /**
     * `Map.find` will run the provided query against the internal Feathers service.
     * If a cacheService was provided and `$fromCache` is provided in the query, the
     * query will only run against the `cacheService`.
     */
    find(query){
      if (service.cacheService && query.$fromCache) {
        delete query.$fromCache;
        return service.cacheService.find({query});
      }
      return service.find({query});
    },

    /**
     * `Map.get` will run the provided query against the internal Feathers service.
     * If a cacheService was provided and `$fromCache` is provided in the params, the
     * query will only run against the `cacheService`.
     */
    get(id, params){
      if (service.cacheService && params.$fromCache) {
        delete params.$fromCache;
        return service.cacheService.get(id, params);
      }
      return service.get(id, params);
    }
  }, canEvent);

  // Setup access to cache service through the Map.cache object.
  if (service.cacheService) {
    Object.assign(Map, {
      cache: {
        find(query){
          return service.cacheService.find({query});
        },

        get(id, params){
          return service.cacheService.get(id, params);
        }
      }
    });

    service.cacheService.before({
      all: [
        // Prevent overwriting the idProp of the cached data.
        translateIds({
          remoteIdProp: service.idProp,
          cacheIdProp: service.cacheIdProp
        })
      ]
    });

    service.cacheService.after({
      all: [
        // Restore the original idProp of the cached data.
        translateIds({
          remoteIdProp: service.idProp,
          cacheIdProp: service.cacheIdProp
        }),
        // Make sure results from the cache are DefineMaps and DefineLists
        hydrate({ Map, List })
      ]
    });

    Object.assign(Map.constructor.prototype, {
      cache(){
        return service.cacheService.create(this.serialize()).then(cachedInstance => {
          Map.dispatch('cached', [cachedInstance]);
          return cachedInstance;
        });
      }
    });
  }

  // Extend the Map instances.
  Object.assign(Map.constructor.prototype, {

    /**
     * When instances are saved, if they have an `idProp` already, run `service.update`
     * on the instance and trigger the `updated` event on the Map when the data returns.
     * If there is no `idProp`, run `service.create` and trigger the `created` event.
     * @return {[type]} [description]
     */
    save(){
      let id = this[Map.idProp];
      if (id) {
        return service.update(id, this.serialize()).then(response => {
          Map.dispatch('updated', [response]);
          return response;
        });
      } else {
        return service.create(this.serialize()).then(response => {
          Map.dispatch('created', [response]);
          return response;
        });
      }
      return ;
    },

    /**
     * `patch()` currently requires passing in a props object.  In the future,
     * we should update it to watch for props that change and mark them as dirty,
     * then it can only send the dirty props.  For now, passing the props will
     * send those props as the patch request.
     */
    patch(props = {}){
      let id = this[Map.idProp];
      return service.patch(id, props).then(response => {
        Map.dispatch('patched', [response]);
        return response;
      });
    },

    destroy(){
      let id = this[Map.idProp];
      if (id) {
        return service.remove(id).then(response => {
          Map.dispatch('destroyed', [response]);
          return response;
        });
      }
      return Promise.resolve(this);
    }
  });

  // Extend the List instances
  Object.assign(service.List.constructor.prototype, {
    save(){
      return true;
    },
    patch(){
      return true;
    },
    destroy(){
      return true;
    }
  });

  // Add before hooks.
  service.before({
    all: [],
    find: [
      cache.find()
    ],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  });

  // Add after hooks.
  service.after({
    all: [
      hydrate()
    ],
    find: [
      cache.merge()
    ],
    create: [
      cache.mergeOne()
    ]
  });

  return service;
}
