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
 *  - The `cacheIdProp` is the id of the object inside the cacheService.  You need
 *    to make sure it exactly matches whatever your cacheService uses, or the
 *    overrided value, if that's possible.  NeDB in the browser, for example,
 *    is hard-coded to use `_id`, so you'd need to set the `cacheIdProp` to `_id`.
 *  - The `storedCacheIdProp` is a copy of the id inside the cacheService, but it
 *    is added by this name to items pulled from the cache. This is helpful for
 *    debugging cache issues.
 */
const defaults = {
  remoteIdProp: undefined,
  storedRemoteIdProp: '__remoteId', // Where the remote id is stored while cached.
  cacheIdProp: undefined, // The id property in the local cache service.
  storedCacheIdProp: '__cacheId' // A reference to the id in the cache.
};

/**
 * The `remoteIdProp` is the only required option.
 */
export default function(options){
  options = Object.assign({}, defaults, options);

  /**
   * `getCleanObject` helps make sure that the original object is never modified
   * and that if a DefineMap is passed, that we use the plain object representation
   * of the data it contains.
   * @param  {[type]} obj or DefineMap
   * @return {[type]} obj
   */
  function getCleanObject(obj){
    if (obj.get) {
      obj = obj.get();
      return obj;
    }
    return Object.assign({}, obj);
  }

  /**
   * `cacheIn` prepares data to be saved into the cache.
   */
  function cacheIn(obj, opts){
    var object = getCleanObject(obj);
    // Copies `object.__remoteId` to `object._id`  It's ok if remoteIdProp is undefined.
    object[opts.storedRemoteIdProp] = object[opts.remoteIdProp];
    delete object[opts.remoteIdProp];
    return object;
  }

  // function cacheIn(obj, opts){
  //   var object = getCleanObject(obj);
  //   object[opts.storedCacheIdProp] = object[opts.cacheIdProp];
  //   delete object[opts.cacheIdProp];
  //   if (object[opts.storedRemoteIdProp] !== null && object[opts.storedRemoteIdProp !== undefined]) {
  //     object[opts.remoteIdProp] = object[opts.storedRemoteIdProp];
  //     delete object[opts.storedRemoteIdProp];
  //   }
  //   return object;
  // }

  /**
   * `cacheOut` restores data to its out-of-cache state.
   */
  function cacheOut(obj, opts){
    var object = getCleanObject(obj);
    object[opts.remoteIdProp] = object[opts.storedRemoteIdProp];
    delete object[opts.storedRemoteIdProp];
    // The id that it was stored under is copied to another attribute
    // on data retrieved from the cache.
    object[opts.storedCacheIdProp] = object[opts.cacheIdProp];
    delete object[opts.cacheIdProp];
    return object;
  }

  return function(hook){
    var {remoteIdProp} = options;

    if (!remoteIdProp) {
      throw new Error('Please setup a `remoteIdProp` for the translateIds hook. See the docs.');
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
          break;

        // before patch
        case 'patch':
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
          break;

        // after create
        case 'create':
          hook.result = cacheOut(hook.result, options);
          break;

        // after update
        case 'update':
          break;

        // after patch
        case 'patch':
          break;

        // after remote
        case 'remove':
          break;
      }


    }
    return hook;
  };
}
