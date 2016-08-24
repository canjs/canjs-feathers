'use strict';

/**
 *
 */
const defaults = {};

export default function(options){
  options = Object.assign({}, defaults, options);

  return function(hook){
    // Only run this hook if this service had a cacheService.
    if (!this.cacheService || hook.params && hook.params.$skipCache) {
      return hook;
    }

    const cacheService = this.cacheService;

    return new Promise(function(resolve, reject){
      function processRequest(response){
        debugger;
        // If we gotRecords, set hook.result so we can return the results faster.
        // If $fromCache was provided, always set hook.result to skip the network request.
        let gotRecords = !response.data ? !!response.length : !!response.data.length;
        if (gotRecords || hook.params.$fromCache) {
          var result = !response.data ? response[0] : response.data[0];
          if (result) {
            hook.result = result.get();
            hook.params.resultsCameFromCache = true;
          }
        }
        resolve(hook);
      }
      var params = {
        query: {
          [options.storedRemoteIdProp]:hook.id
        }
      };
      cacheService.find(params)
        .then(response => processRequest(response))
        .catch(e => {
          console.log('Error message.', hook.data, e);
          reject(e);
        });
    });
  };
}
