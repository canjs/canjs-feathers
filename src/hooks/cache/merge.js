'use strict';
import { sorter as createSorter } from 'feathers-commons/lib/utils';

/**
 *
 */
const defaults = {};

export default function(options){
  options = Object.assign({}, defaults, options);

  return function(hook){
    // Skip this hook if there's no cacheService or we only want cached data,
    // so no merge is necessary.
    if (!this.cacheService || hook.params.query.$fromCache) {
      return hook;
    }

    const idProp = this.idProp,
      // The sort function (if $sort is set)
      $sort = hook.params.query && hook.params.query.$sort,
      sorter = $sort ? createSorter($sort) : createSorter({
        [this.idProp]: 1
      }),
      service = this,
      cacheService = this.cacheService,
      resultsCameFromCache = hook.params.resultsCameFromCache;

    return new Promise(function(resolve, reject){
      // Loop through the List that was pulled from the local service and merge in the
      // results that were retrieved from the remote service.
      //  `hook.result` is the data from the local cache service
      //  `response` is the data from the remote service.
      //
      // TODO: Handle the case when we have an item in local cache, but it's not
      //       on the server.
      function processResult(response){
        var remoteData = !response.data ? response : response.data;

        // If the results came from `cache.find`, diff the results and the remote
        // service response and merge the remote service reponse into the List
        // that we already handed off to the UI.
        if (resultsCameFromCache) {
          // Create a map of the local data for quick lookup.
          var cachedData = !hook.result.data ? hook.result : hook.result.data;
          var cacheMap = {};
          var errored = false;
          cachedData.forEach(item => {
            if (!item[idProp]) {
              console.error(`An idProp of '${idProp}' was not found on the ${service.modelName} instance. Did you set the wrong idProp on the connection?`);
              errored = true;
            } else {
              cacheMap[item[idProp]] = item;
            }
          });

          // Loop through the remote data. If a remote item doesn't exist locally,
          // add it to the List and also add it to the cache.
          remoteData.forEach(item => {
            if (!cacheMap[item[idProp]] && !errored) {
              cachedData.push(item);
              cacheService.create(item);
            }
          });

          // If a $sort param was specified, re-sort the cached array by that value.
          if (sorter) {
            cachedData.sort(sorter);
          }

        // If the results didn't come from cache, save the results to the cache.
        } else {
          var requests = remoteData.map(item => {
            return cacheService.create(item);
          });
          Promise.all(requests).then(responses => {
            console.log(responses);
            return resolve(hook);
          });
        }
      }

      if (resultsCameFromCache) {
        let params = Object.assign({}, hook.params);
        delete params.resultsCameFromCache;
        params.query.$skipCache = true;
        service.find(params)
          .then(response => processResult(response))
          .catch(e => {
            console.log('Error message.', hook.data, e);
            reject(e);
          });

        // Resolve early so the cached result can be returned immediately. We will
        // still hang on to the List to merge in the remote data.
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
}
