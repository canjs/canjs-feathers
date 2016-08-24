import canEvent from 'can-event';
import hydrate from './hooks/hydrate/';
import cache from './hooks/cache/';
import translateIds from './hooks/translate-ids/';
import createOrUpdate from './hooks/create-or-update/';
import setupModelStore from './new-instance/model-store';
import setupModelStoreWithCache from './new-instance/model-store-cache';

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
  if (!options.idProp) {
    throw new Error('Please provide an idProp.');
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
    delete options.cache.service;
    Object.assign(options, {
      cacheOptions: {
        // The id property in the remote database
        remoteIdProp: options.idProp,
        // Where the remote id is stored while cached.
        storedRemoteIdProp: options.cache.storedRemoteIdProp || '__remoteId',
        // A reference to the id in the cache.
        cacheIdProp: options.cache.cacheIdProp || '__cacheId',
        // The id property in the local cache service.
        storedCacheIdProp: options.cache.storedCacheIdProp
      }
    });
  }

  const Map = options.Map;
  const List = Map.List || options.List;
  const defaults = {
    idProp: undefined,
    modelName: name,
    Map,
    List
  };
  Object.assign(service, defaults, options);

  // Extend the Map
  Object.assign(Map, {
    idProp: service.idProp,

    // The model store.
    store: {},

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
    get(id, params = {}){
      if (service.cacheService && params.$fromCache) {
        delete params.$fromCache;
        return service.cacheService.get(id, params);
      }
      return service.get(id, params);
    }
  }, canEvent);

  /**
   * override the Map's newInstance function. If a newInstanceFn was provided,
   * use it, otherwise use the built-in ones for the Model Store or the Model
   * Store with Cache.
   */
  var _newInstance = Map.newInstance; // reference to the original Map.newInstance fn
  Map.newInstance = function(props) {
    // If a newInstanceFn was provided, use it, otherwise use the built-in
    // ones for the Model Store or the Model Store with Cache.
    if (typeof service.newInstanceFn === 'function') {
      return service.newInstanceFn.call(this, props, Map, service, _newInstance);
    }
    // If a cacheService was provided, use its special newInstanceFn.
    if (service.cacheService) {
      return setupModelStoreWithCache.call(this, props, Map, service, _newInstance);
    }
    // Use the model store without cache.
    return setupModelStore.call(this, props, Map, service, _newInstance);
  };


  /**
   * Setup access to cache service through the Map.cache object.
   */
  if (service.cacheService) {

    // Add cache.find and cache.get methods to the Map to directly query the cache.
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

    // Setup before hooks on the cacheService.
    service.cacheService.before({
      all: [
        // Prevent overwriting the idProp of the cached data.
        translateIds(service.cacheOptions)
      ],
      create: [
        createOrUpdate(service.cacheOptions)
      ]
    });

    // Setup after hooks on the cacheService.
    service.cacheService.after({
      all: [
        // Restore the original idProp of the cached data.
        translateIds(service.cacheOptions),
        // Make sure results from the cache are DefineMaps and DefineLists
        hydrate({ Map, List })
      ]
    });

    // Make it possible to call `cache` on Map instances to save them to the cache.
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
      if (id !== undefined) {
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
    get: [
      cache.get(service.cacheOptions)
    ],
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
    get: [
      cache.mergeOne()
    ],
    create: [
      cache.mergeOne()
    ],
    update: [
      cache.mergeOne()
    ],
    patch: [
      cache.mergeOne()
    ],
    remove: [
      cache.remove(service.cacheOptions)
    ]
  });

  return service;
}
