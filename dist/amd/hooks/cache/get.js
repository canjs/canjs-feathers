/*canjs-feathers@1.0.0#hooks/cache/get*/
define([], function () {
    'use strict';
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            if (!this.cacheService || hook.params && hook.params.$skipCache) {
                return hook;
            }
            var cacheService = this.cacheService;
            return new Promise(function (resolve, reject) {
                var $__2;
                function processRequest(response) {
                    var gotRecords = !response.data ? !!response.length : !!response.data.length;
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
                    query: ($__2 = {}, Object.defineProperty($__2, options.storedRemoteIdProp, {
                        value: hook.id,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    }), $__2)
                };
                cacheService.find(params).then(function (response) {
                    return processRequest(response);
                }).catch(function (e) {
                    console.log('Error message.', hook.data, e);
                    reject(e);
                });
            });
        };
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});