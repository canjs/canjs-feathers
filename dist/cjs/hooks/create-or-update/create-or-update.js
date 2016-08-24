/*canjs-feathers@1.0.0#hooks/create-or-update/create-or-update*/
'use strict';
var $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__;
var deepAssign = ($__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ = require('can-util/js/deep-assign/deep-assign'), $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ && $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__.__esModule && $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ || { default: $__can_45_util_47_js_47_deep_45_assign_47_deep_45_assign__ }).default;
var defaults = { remoteIdProp: undefined };
var $__default = function (options) {
    options = Object.assign({}, defaults, options);
    if (!options.remoteIdProp) {
        throw new Error('The remoteIdProp (for the remote service) must be provided.');
    }
    return function (hook) {
        var service = this;
        return new Promise(function (resolve, reject) {
            var $__3, $__4;
            var params = { query: { $or: [] } };
            var __cacheId = hook.data[options.storedCacheIdProp];
            if (__cacheId !== null && __cacheId !== undefined) {
                params.query.$or.push(($__3 = {}, Object.defineProperty($__3, options.storedCacheIdProp, {
                    value: hook.data[options.storedCacheIdProp],
                    configurable: true,
                    enumerable: true,
                    writable: true
                }), $__3));
            }
            var _id = hook.data[options.storedRemoteIdProp];
            if (_id !== null && _id !== undefined) {
                params.query.$or.push(($__4 = {}, Object.defineProperty($__4, options.storedRemoteIdProp, {
                    value: hook.data[options.storedRemoteIdProp],
                    configurable: true,
                    enumerable: true,
                    writable: true
                }), $__4));
            }
            if (params.query.$or.length) {
                service.find(params).then(function (response) {
                    var data = !response.data ? response : response.data;
                    if (data.length) {
                        var updateData = deepAssign({}, hook.data);
                        delete updateData[options.storedCacheIdProp];
                        var id = hook.data[options.storedCacheIdProp] || data[0][options.cacheIdProp];
                        service.update(id, updateData).then(function (updateResponse) {
                            hook.result = updateResponse;
                            resolve(hook);
                        }).catch(function (err) {
                            console.error(err);
                            reject(hook);
                        });
                    } else {
                        resolve(hook);
                    }
                }).catch(function (err) {
                    console.log(err);
                    reject(hook);
                });
            } else {
                resolve(hook);
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