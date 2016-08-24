'use strict';

/**
 * The `translateIds` hook takes care of conflicts between the id property of the
 * remote service and the cached service.  For example, MongoDB and NeDB both are
 * hard-coded to use `_id` as the idProp, so using NeDB as a cache for a remote
 * MongoDB server will result in errors.  To work around this, the four separate
 * id properties are used:
 *  - The `remoteIdProp` is id is the id property in the remote database. It must
 *    exactly match whatever the remote database natively uses or the overrided
 *    id property that you've specified, if you've setup your database or service
 *    to do so. For example, MongoDB and NeDB are hard-coded to use `_id`, and
 *    it's not possible to change at the database level. But it's possible to use
 *    a separate field as the id property in your service.  In that case, the
 *    `remoteIdProp` would have to match this id property.
 *  - The `storedRemoteIdProp` is the key where the remote id is stored while the
 *    data is in the cache.
 *  - The `storedCacheIdProp` is the id of the object inside the cacheService.  You need
 *    to make sure it exactly matches whatever your cacheService uses, or the
 *    overrided value, if that's possible.  NeDB in the browser, for example,
 *    is hard-coded to use `_id`, so you'd need to set the `storedCacheIdProp` to `_id`.
 *  - The `cacheIdProp` is a copy of the id inside the cacheService, but it
 *    is added by this name to items pulled from the cache. This is helpful for
 *    debugging cache issues.
 */
export const defaults = {
  remoteIdProp: undefined,
  storedRemoteIdProp: '__remoteId', // Where the remote id is stored while cached.
  cacheIdProp: '__cacheId', // A reference to the id in the cache.
  storedCacheIdProp: undefined // The id property in the local cache service.
};

/**
 * `getCleanObject` helps make sure that the original object is never modified
 * and that if a DefineMap is passed, that we use the plain object representation
 * of the data it contains.
 * @param  {[type]} obj or DefineMap
 * @return {[type]} obj
 */
export function getCleanObject(obj){
  if (obj.get) {
    obj = obj.get();
    return obj;
  }
  return Object.assign({}, obj);
}

/**
 * `cacheIn` prepares data to be saved into the cache.
 */
export function cacheIn(obj, opts){
  var object = getCleanObject(obj);

  // Don't copy the prop if it's already in place.  Calls from create-or-update.js, for example,
  // will already have the correct properties in place because that hook runs after this one.
  if (object[opts.storedRemoteIdProp] === undefined) {
    // Copies `object.__remoteId` to `object._id`  It's ok if remoteIdProp is undefined.
    object[opts.storedRemoteIdProp] = object[opts.remoteIdProp];
    delete object[opts.remoteIdProp];
  }

  // Don't copy the cacheIdProp if it's already in place.
  if (object[opts.storedCacheIdProp] === undefined) {
    if (object[opts.cacheIdProp] !== undefined) {
      object[opts.storedCacheIdProp] = object[opts.cacheIdProp];
      delete object[opts.cacheIdProp];
    }
  }
  return object;
}

/**
 * `cacheOut` restores data to its out-of-cache state.
 */
export function cacheOut(obj, opts){
  var object = getCleanObject(obj);
  // Copy the __remoteId to the _id if it's not undefined. Always remove the __remoteId.
  if (object[opts.storedRemoteIdProp] !== null && object[opts.storedRemoteIdProp] !== undefined) {
    object[opts.remoteIdProp] = object[opts.storedRemoteIdProp];
  }
  delete object[opts.storedRemoteIdProp];

  // The id that it was stored under is copied to another attribute
  // on data retrieved from the cache.
  object[opts.cacheIdProp] = object[opts.storedCacheIdProp];
  delete object[opts.storedCacheIdProp];
  return object;
}

/**
 * The `remoteIdProp` is the only required option.
 */
export default function(options){
  options = Object.assign({}, defaults, options);

  return function(hook){
    var {remoteIdProp} = options;

    if (!remoteIdProp) {
      console.error('Please setup a `remoteIdProp` for the translateIds hook. See the docs.');
    }

    // Handle as a before hook.  Data/params are GOING IN to the cache.
    if (hook.type === 'before') {

      switch (hook.method) {
        // before find
        case 'find':
          break;

        // before get
        case 'get':
          break;

        // before create
        case 'create':
          hook.data = cacheIn(hook.data, options);
          break;

        // before update
        case 'update':
          hook.data = cacheIn(hook.data, options);
          break;

        // before remove
        case 'remove':
          break;
      }

    // Handle as an AFTER hook.  Data is COMING OUT of the cache.
    } else {
      switch (hook.method) {

        // after find
        case 'find':
          let inDataProp = !!hook.result.data;
          let results = inDataProp ? hook.result.data : hook.result;
          results = results.map(item => {
            return cacheOut(item, options);
          });

          // Put the reformatted data back in place on the hook.
          if (inDataProp) {
            hook.result.data = results;
          } else {
            hook.result = results;
          }
          break;

        // after get
        case 'get':
          hook.result = cacheOut(hook.result, options);
          break;

        // after create
        case 'create':
          hook.result = cacheOut(hook.result, options);
          break;

        // after update
        case 'update':
          hook.result = cacheOut(hook.result, options);
          break;

        // after remote
        case 'remove':
          break;
      }


    }
    return hook;
  };
}
