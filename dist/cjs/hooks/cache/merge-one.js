/*canjs-feathers@1.0.0#hooks/cache/merge-one*/
'use strict';
var defaults = {};
var $__default = function (options) {
    options = Object.assign({}, defaults, options);
    return function (hook) {
        if (!this.cacheService) {
            return hook;
        }
        var service = this, cacheService = this.cacheService, resultsCameFromCache = hook.params.resultsCameFromCache;
        return new Promise(function (resolve, reject) {
            function processResult(response) {
                if (resultsCameFromCache) {
                    return resolve(hook);
                } else {
                    cacheService.create(response.get()).then(function () {
                        return resolve(hook);
                    }).catch(function (err) {
                        console.log(err);
                    });
                }
            }
            if (resultsCameFromCache) {
                var params = Object.assign({}, hook.params);
                delete params.resultsCameFromCache;
                params.$skipCache = true;
                service.get(hook.id, params).then(function (response) {
                    return processResult(response);
                }).catch(function (e) {
                    console.log('Error message.', hook.data, e);
                    reject(e);
                });
                resolve(hook);
            } else {
                processResult(hook.result);
            }
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