/*canjs-feathers@1.0.0#hooks/hydrate/hydrate*/
'use strict';
var defaults = {};
var $__default = function (options) {
    options = Object.assign({}, defaults, options);
    return function (hook) {
        if (hook.params.query && hook.params.query.$raw) {
            return hook;
        }
        if (hook.method === 'find') {
            var List = options.List || this.List;
            if (!List) {
                throw new Error('Please pass a List constructor.');
            }
            if (hook.result.data) {
                var data = new List(hook.result.data);
                delete hook.result.data;
                Object.assign(data, hook.result);
                hook.result.data = data;
            } else {
                hook.result = new List(hook.result);
            }
            return hook;
        } else {
            var Map = options.Map || this.Map;
            if (!Map) {
                throw new Error('Please pass a Map constructor.');
            }
            hook.result = new Map(hook.result);
        }
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