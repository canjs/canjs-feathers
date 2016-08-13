'use strict';

export default {
  update(options){
    const defaults = {};
    options = Object.assign({}, defaults, options);
    return function(hook){
      if (hook.result) {
        if (Array.isArray(hook.result)) {

        }
      }
    };
  }
};


/**
 * Converts the results of a query into a List for arrays or a Map for objects.
 * You can pass `$raw:true` in the query params to skip this and get the raw data.
 */

module.exports = function(options){
  options = Object.assign({}, defaults, options);

  return function(hook){
    // If `$raw:true` was passed in the query, skip this hook.
    if (hook.params.query && hook.params.query.$raw) {
      return hook;
    }

    // Convert the result array into a result List.
    if (hook.method === 'find') {
      const List = options.List || this.List;
      if (!List) {
        throw new Error('Please pass a List constructor.');
      }

      if (Array.isArray(hook.result)) {
        hook.result = new List(hook.result);
      } else {
        let data = new List(hook.result.data);
        delete hook.result.data;

        // Assign the pagination attributes as expandos on the List.
        Object.assign(data, hook.result);

        hook.result.data = data;
      }
      return hook;

    // Convert the result to a Map
    } else {
      const Map = options.Map || this.Map;
      if (!Map) {
        throw new Error('Please pass a Map constructor.');
      }
      hook.result = new Map(hook.result);
    }

  };
};
