'use strict';

/**
 *
 */
const defaults = {
  remoteIdProp: undefined
};

module.exports = function(options){
  options = Object.assign({}, defaults, options);

  if (!options.remoteIdProp) {
    throw new Error('The remoteIdProp (for the remote service) must be provided.');
  }

  return function(hook){
    const service = this;
    var __cacheId = hook.data[options.storedCacheIdProp];

    return new Promise(function(resolve){

      // Search for the record by cachedIdProp.
      service.find({[options.cacheIdProp]: hook.data[options.storedCacheIdProp]})
        .then(response => {
          let data = !response.data ? response : response.data;
          // This model already exists.  Update it.
          if (data.length) {
            service.update(hook.data[options.cacheIdProp]).then(updateResponse => {
              hook.result = updateResponse;
              resolve(hook);
            });

          // Search for the record in the cache by remoteId.
          } else {
            return service.find({[options.storedRemoteIdProp]: hook.data[options.storedRemoteIdProp]});
          }
        })
        .then(response => {
          let data = !response.data ? response : response.data;
          if (data.length) {
            service.update(hook.data[options.cacheIdProp]).then(updateResponse => {
              hook.result = updateResponse;
              resolve(hook);
            });

          // This model wasn't found in the cache, so let it be created like normal.
          } else {
            resolve(hook);
          }
        })
        .catch(() => resolve(hook));
    });
  };
};
