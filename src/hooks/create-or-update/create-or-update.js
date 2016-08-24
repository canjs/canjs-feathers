'use strict';
import deepAssign from 'can-util/js/deep-assign/deep-assign';

/**
 *
 */
const defaults = {
  remoteIdProp: undefined
};

export default function(options){
  options = Object.assign({}, defaults, options);

  if (!options.remoteIdProp) {
    throw new Error('The remoteIdProp (for the remote service) must be provided.');
  }

  return function(hook){
    const service = this;

    return new Promise(function(resolve, reject){

      // If we have any type of idProp on the data, build a query to see if this
      // same instance already exists in the cache, because we need to update it.
      var params = {
        query: {
          $or: []
        }
      };
      var __cacheId = hook.data[options.storedCacheIdProp];
      if (__cacheId !== null && __cacheId !== undefined) {
        params.query.$or.push({[options.storedCacheIdProp]: hook.data[options.storedCacheIdProp]});
      }
      var _id = hook.data[options.storedRemoteIdProp];
      if (_id !== null && _id !== undefined) {
        params.query.$or.push({[options.storedRemoteIdProp]: hook.data[options.storedRemoteIdProp]});
      }

      // If there was at least one idProp to search on, run the query.
      if (params.query.$or.length) {
        service.find(params)
          .then(response => {
            let data = !response.data ? response : response.data;
            // This model already exists in the cache.  Update it.
            if (data.length) {
              var updateData = deepAssign({}, hook.data);
              delete updateData[options.storedCacheIdProp];
              service.update(hook.data[options.storedCacheIdProp], updateData).then(updateResponse => {
                hook.result = updateResponse;
                resolve(hook);
              })
              .catch(err => {
                console.error(err);
                reject(hook);
              });

            // It's not in the cache. Move along. Nothing to see here.
            } else {
              resolve(hook);
            }
          })
          .catch(err => {
            console.log(err);
            reject(hook);
          });

      // Otherwise, just resolve, since there's nothing to find.
      } else {
        resolve(hook);
      }


    });
  };
};
