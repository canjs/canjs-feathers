/*canjs-feathers@1.0.0#hooks/cache/cache*/
define([
    './find',
    './get',
    './remove',
    './merge',
    './merge-one'
], function ($__0, $__2, $__4, $__6, $__8) {
    'use strict';
    if (!$__0 || !$__0.__esModule)
        $__0 = { default: $__0 };
    if (!$__2 || !$__2.__esModule)
        $__2 = { default: $__2 };
    if (!$__4 || !$__4.__esModule)
        $__4 = { default: $__4 };
    if (!$__6 || !$__6.__esModule)
        $__6 = { default: $__6 };
    if (!$__8 || !$__8.__esModule)
        $__8 = { default: $__8 };
    var find = $__0.default;
    var get = $__2.default;
    var remove = $__4.default;
    var merge = $__6.default;
    var mergeOne = $__8.default;
    var $__default = {
        find: find,
        get: get,
        remove: remove,
        merge: merge,
        mergeOne: mergeOne
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});