/*canjs-feathers@1.0.0#new-instance/model-store*/
'use strict';
var $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__;
var deepAssign = ($__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ = require('can-util/js/deep-assign/deep-assign'), $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ && $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__.__esModule && $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ || { default: $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ }).default;
var $__default = function (props, Map, service, parentNewInstanceFn) {
    var id = props[service.idProp];
    if (id !== null && id !== undefined) {
        var cachedInst = Map.store[id];
        if (cachedInst) {
            cachedInst = deepAssign(cachedInst, props);
            return cachedInst;
        }
    }
    var newInst = parentNewInstanceFn.call(this, props);
    if (id !== null && id !== undefined) {
        Map.store[id] = newInst;
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