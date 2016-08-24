'use strict';

/**
 * `cache.remove` hook.
 * The cache hooks are useful to synchronize two services. For the remove hook,
 * when an item is removed from the primary service, it will also remove it from
 * the cacheService, if enabled.
 * Use as an after hook on another service.
 */
const defaults = {};

export default function(options){
  options = Object.assign({}, defaults, options);

  return function(hook){
    // Skip this hook if there's no cacheService or we only want cached data.
    if (!this.cacheService || hook.params.$fromCache) {
      return hook;
    }

    const cacheService = this.cacheService;
    const params = {
      query: {
        [options.storedRemoteIdProp]: hook.id
      }
    };

    return new Promise(function(resolve, reject){
      cacheService.remove(null, params)
        .then(() => {
          resolve(hook);
        })
        .catch(e => {
          console.log('Error message.', hook.data, e);
          reject(e);
      });
    });
  };
}
