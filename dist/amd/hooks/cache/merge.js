/*canjs-feathers@1.0.0#hooks/cache/merge*/
define(['feathers-commons/lib/utils'], function ($__0) {
    'use strict';
    if (!$__0 || !$__0.__esModule)
        $__0 = { default: $__0 };
    var createSorter = $__0.sorter;
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            var $__3;
            if (!this.cacheService || hook.params.query.$fromCache) {
                return hook;
            }
            var idProp = this.idProp, $sort = hook.params.query && hook.params.query.$sort, sorter = $sort ? createSorter($sort) : createSorter(($__3 = {}, Object.defineProperty($__3, this.idProp, {
                    value: 1,
                    configurable: true,
                    enumerable: true,
                    writable: true
                }), $__3)), service = this, cacheService = this.cacheService, resultsCameFromCache = hook.params.resultsCameFromCache;
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
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});