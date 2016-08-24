'use strict';

/**
 * Converts the results of a query into a List for arrays or a Map for objects.
 * You can pass `$raw:true` in the query params to skip this and get the raw data.
 */
const defaults = {};

export default function(options){
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

      // Pagination was enabled, so find the array at `result.data`
      if (hook.result.data) {
        let data = new List(hook.result.data);
        delete hook.result.data;

        // Assign the `limit`, `skip`, and `total` attributes as expandos on the List.
        Object.assign(data, hook.result);

        hook.result.data = data;

      // Pagination is not enabled. `result` is an array.
      } else {
        hook.result = new List(hook.result);
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
