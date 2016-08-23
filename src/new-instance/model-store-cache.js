import deepAssign from 'can-util/js/deep-assign/deep-assign';

export default function(props, Map, service, parentNewInstanceFn){
  let id = props[service.idProp],
    cacheId = 'cache:' + props[service.cacheOptions.storedCacheIdProp];

  // If there is no id, try for a cacheId, which means the instance came from the cache.
  if ((id === null || id === undefined) && cacheId !== null && cacheId !== undefined) {
    // Cached instance ids are stored in the format `__cache:1`
    id = 'cache:' + props[service.cacheOptions.storedCacheIdProp];
  }

  // If there's an id, look in the Map.store to see if the object already exists
  if (id) {
    var cachedInst = Map.store[id];
    if(cachedInst) {
      // Copy all new attributes to the cached instance and return it.
      cachedInst = deepAssign(cachedInst, props);
      return cachedInst;
    }
  }

  // There was no id, call the original newInstance function and return a new
  // instance of Person.
  var newInst = parentNewInstanceFn.call(this, props);
  if (id) {
    Map.store[id] = newInst;
  }
  return newInst;
}
