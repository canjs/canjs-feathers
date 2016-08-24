/*canjs-feathers@1.0.0#new-instance/model-store*/
define(['can-util/js/deep-assign'], function ($__0) {
    'use strict';
    if (!$__0 || !$__0.__esModule)
        $__0 = { default: $__0 };
    var deepAssign = $__0.default;
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
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});