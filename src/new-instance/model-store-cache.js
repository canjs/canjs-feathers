import deepAssign from 'can-util/js/deep-assign/deep-assign';

export default function(props, Map, service, parentNewInstanceFn){
  let id = props[service.idProp],
    cacheId = props[service.cacheOptions.storedCacheIdProp],
    cachedInst;

  if (cacheId !== null && cacheId !== undefined) {
    cacheId = 'cache:' + props[service.cacheOptions.storedCacheIdProp];
  }

  let haveId = id !== null && id !== undefined;
  let haveCacheId = cacheId !== null && cacheId !== undefined;
  cachedInst = Map.store[id] || Map.store[cacheId];

  // If there's an id, look in the Map.store to see if the object already exists
  if(cachedInst) {
    if (haveId) {
      Map.store[id] = cachedInst;
      delete Map.store[cacheId];
    }
    if (haveCacheId && !haveId) {
      Map.store[cacheId] = cachedInst;
    }
    // Copy all new attributes to the cached instance and return it.
    cachedInst = deepAssign(cachedInst, props);
    return cachedInst;
  }

  // There was no id, call the original newInstance function and return a new
  // instance of Person.
  var newInst = parentNewInstanceFn.call(this, props);
  if (haveId) {
    Map.store[id] = newInst;
    delete Map.store[cacheId];
  }
  if (haveCacheId && !haveId) {
    Map.store[cacheId] = newInst;
  }
  return newInst;
}
