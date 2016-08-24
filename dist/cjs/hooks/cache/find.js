/*canjs-feathers@1.0.0#hooks/cache/find*/
'use strict';
var defaults = {};
var $__default = function (options) {
    options = Object.assign({}, defaults, options);
    return function (hook) {
        if (!this.cacheService || hook.params.query && hook.params.query.$skipCache) {
            return hook;
        }
        var cacheService = this.cacheService;
        return new Promise(function (resolve, reject) {
            function processRequest(response) {
                var gotRecords = !response.data ? !!response.length : !!response.data.length;
                if (gotRecords || hook.params.$fromCache) {
                    hook.result = response;
                    hook.params.resultsCameFromCache = true;
                }
                resolve(hook);
            }
            cacheService.find(hook.params).then(function (response) {
                return processRequest(response);
            }).catch(function (e) {
                console.log('Error message.', hook.data, e);
                reject(e);
            });
        });
    };
};
Object.defineProperties(module.exports, {
    default: {
        get: function () {
            return $__default;
        }
    },
    __esModule: { value: true }
});