/*canjs-feathers@1.0.0#hooks/cache/remove*/
define([], function () {
    'use strict';
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            var $__2;
            if (!this.cacheService || hook.params.$fromCache) {
                return hook;
            }
            var cacheService = this.cacheService;
            var params = {
                query: ($__2 = {}, Object.defineProperty($__2, options.storedRemoteIdProp, {
                    value: hook.id,
                    configurable: true,
                    enumerable: true,
                    writable: true
                }), $__2)
            };
            return new Promise(function (resolve, reject) {
                cacheService.remove(null, params).then(function () {
                    resolve(hook);
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