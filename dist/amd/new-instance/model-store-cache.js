/*canjs-feathers@1.0.0#new-instance/model-store-cache*/
define(['can-util/js/deep-assign'], function ($__0) {
    'use strict';
    if (!$__0 || !$__0.__esModule)
        $__0 = { default: $__0 };
    var deepAssign = $__0.default;
    var $__default = function (props, Map, service, parentNewInstanceFn) {
        var id = props[service.idProp], cacheId = props[service.cacheOptions.cacheIdProp], cachedInst;
        if (cacheId !== null && cacheId !== undefined) {
            cacheId = 'cache:' + props[service.cacheOptions.cacheIdProp];
        }
        var haveId = id !== null && id !== undefined;
        var haveCacheId = cacheId !== null && cacheId !== undefined;
        cachedInst = Map.store[id] || Map.store[cacheId];
        if (cachedInst) {
            if (haveId) {
                Map.store[id] = cachedInst;
                delete Map.store[cacheId];
            }
            if (haveCacheId && !haveId) {
                Map.store[cacheId] = cachedInst;
            }
            cachedInst = deepAssign(cachedInst, props);
            return cachedInst;
        }
        var newInst = parentNewInstanceFn.call(this, props);
        if (haveId) {
            Map.store[id] = newInst;
            delete Map.store[cacheId];
        }
        if (haveCacheId && !haveId) {
            Map.store[cacheId] = newInst;
        }
        return newInst;
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});