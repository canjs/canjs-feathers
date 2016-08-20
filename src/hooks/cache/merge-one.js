'use strict';

/**
 *
 */
const defaults = {};

module.exports = function(options){
  options = Object.assign({}, defaults, options);

  return function(hook){
    // Skip this hook if there's no cacheService or we only want cached data,
    // so no merge is necessary.
    if (!this.cacheService) {
      return hook;
    }

    const idProp = this.idProp,
      service = this,
      cacheService = this.cacheService,
      resultsCameFromCache = hook.params.resultsCameFromCache;

    return new Promise(function(resolve, reject){
      function processResult(response){
        // We got the result from the cache, so we need to make the request to
        // the remote service.
        if (resultsCameFromCache) {
          // service[hook.method]()

        // This was a normal request, so save the result to the cache.
        } else {
          cacheService.create(response.get()).then(() => {
            resolve(hook);
          });
        }
      }

      if (resultsCameFromCache) {
        let params = Object.assign({}, hook.params);
        delete params.resultsCameFromCache;
        params.query.$skipCache = true;
        service.get(hook.id, params)
          .then(response => processResult(response))
          .catch(e => {
            console.log('Error message.', hook.data, e);
            reject(e);
          });

        // Resolve early so the cached result can be returned immediately. We will
        // still hang on to the Map instance to merge in the remote data.
        resolve(hook);

      // The results weren't from cache, they were from the server.  In other words,
      // the `cache.find` hook didn't find any data in the cache, so in order to
      // prevent the response from returning an empty set too early, the normal
      // request to the remote service is allowed to go through.
      } else {
        processResult(hook.result);
      }
    });
  };
};
