/*canjs-feathers@1.0.0#new-instance/model-store-cache*/
'use strict';
var $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__;
var deepAssign = ($__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ = require('can-util/js/deep-assign/deep-assign'), $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ && $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__.__esModule && $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ || { default: $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ }).default;
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
Object.defineProperties(module.exports, {
    default: {
        get: function () {
            return $__default;
        }
    },
    __esModule: { value: true }
});