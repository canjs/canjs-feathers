/*canjs-feathers@1.0.0#hooks/cache/cache*/
'use strict';
var $__find__, $__get__, $__remove__, $__merge__, $__merge_45_one__;
var find = ($__find__ = require('./find.js'), $__find__ && $__find__.__esModule && $__find__ || { default: $__find__ }).default;
var get = ($__get__ = require('./get.js'), $__get__ && $__get__.__esModule && $__get__ || { default: $__get__ }).default;
var remove = ($__remove__ = require('./remove.js'), $__remove__ && $__remove__.__esModule && $__remove__ || { default: $__remove__ }).default;
var merge = ($__merge__ = require('./merge.js'), $__merge__ && $__merge__.__esModule && $__merge__ || { default: $__merge__ }).default;
var mergeOne = ($__merge_45_one__ = require('./merge-one.js'), $__merge_45_one__ && $__merge_45_one__.__esModule && $__merge_45_one__ || { default: $__merge_45_one__ }).default;
var $__default = {
    find: find,
    get: get,
    remove: remove,
    merge: merge,
    mergeOne: mergeOne
};
Object.defineProperties(module.exports, {
    default: {
        get: function () {
            return $__default;
        }
    },
    __esModule: { value: true }
});