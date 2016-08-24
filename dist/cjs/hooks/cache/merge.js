/*canjs-feathers@1.0.0#hooks/cache/merge*/
'use strict';
var $__feathers_45_commons_47_lib_47_utils__;
var createSorter = ($__feathers_45_commons_47_lib_47_utils__ = require('feathers-commons/lib/utils'), $__feathers_45_commons_47_lib_47_utils__ && $__feathers_45_commons_47_lib_47_utils__.__esModule && $__feathers_45_commons_47_lib_47_utils__ || { default: $__feathers_45_commons_47_lib_47_utils__ }).sorter;
var defaults = {};
var $__default = function (options) {
    options = Object.assign({}, defaults, options);
    return function (hook) {
        var $__2;
        if (!this.cacheService || hook.params.query.$fromCache) {
            return hook;
        }
        var idProp = this.idProp, $sort = hook.params.query && hook.params.query.$sort, sorter = $sort ? createSorter($sort) : createSorter(($__2 = {}, Object.defineProperty($__2, this.idProp, {
                value: 1,
                configurable: true,
                enumerable: true,
                writable: true
            }), $__2)), service = this, cacheService = this.cacheService, resultsCameFromCache = hook.params.resultsCameFromCache;
        return new Promise(function (resolve, reject) {
            function processResult(response) {
                var remoteData = !response.data ? response : response.data;
                if (resultsCameFromCache) {
                    var cachedData = !hook.result.data ? hook.result : hook.result.data;
                    var cacheMap = {};
                    var errored = false;
                    cachedData.forEach(function (item) {
                        if (!item[idProp]) {
                            console.error('An idProp of \'' + idProp + '\' was not found on the ' + service.modelName + ' instance. Did you set the wrong idProp on the connection?');
                            errored = true;
                        } else {
                            cacheMap[item[idProp]] = item;
                        }
                    });
                    remoteData.forEach(function (item) {
                        if (!cacheMap[item[idProp]] && !errored) {
                            cachedData.push(item);
                            cacheService.create(item);
                        }
                    });
                    if (sorter) {
                        cachedData.sort(sorter);
                    }
                } else {
                    var requests = remoteData.map(function (item) {
                        return cacheService.create(item);
                    });
                    Promise.all(requests).then(function (responses) {
                        console.log(responses);
                        return resolve(hook);
                    });
                }
            }
            if (resultsCameFromCache) {
                var params = Object.assign({}, hook.params);
                delete params.resultsCameFromCache;
                params.query.$skipCache = true;
                service.find(params).then(function (response) {
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