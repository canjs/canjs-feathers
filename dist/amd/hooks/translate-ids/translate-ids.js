/*canjs-feathers@1.0.0#hooks/translate-ids/translate-ids*/
define([], function () {
    'use strict';
    var defaults = {
        remoteIdProp: undefined,
        storedRemoteIdProp: '__remoteId',
        cacheIdProp: '__cacheId',
        storedCacheIdProp: undefined
    };
    function getCleanObject(obj) {
        if (obj.get) {
            obj = obj.get();
            return obj;
        }
        return Object.assign({}, obj);
    }
    function cacheIn(obj, opts) {
        var object = getCleanObject(obj);
        if (object[opts.storedRemoteIdProp] === undefined) {
            object[opts.storedRemoteIdProp] = object[opts.remoteIdProp];
            delete object[opts.remoteIdProp];
        }
        if (object[opts.storedCacheIdProp] === undefined) {
            if (object[opts.cacheIdProp] !== undefined) {
                object[opts.storedCacheIdProp] = object[opts.cacheIdProp];
                delete object[opts.cacheIdProp];
            }
        }
        return object;
    }
    function cacheOut(obj, opts) {
        var object = getCleanObject(obj);
        if (object[opts.storedRemoteIdProp] !== null && object[opts.storedRemoteIdProp] !== undefined) {
            object[opts.remoteIdProp] = object[opts.storedRemoteIdProp];
        }
        delete object[opts.storedRemoteIdProp];
        object[opts.cacheIdProp] = object[opts.storedCacheIdProp];
        delete object[opts.storedCacheIdProp];
        return object;
    }
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            var remoteIdProp = options.remoteIdProp;
            if (!remoteIdProp) {
                console.error('Please setup a `remoteIdProp` for the translateIds hook. See the docs.');
            }
            if (hook.type === 'before') {
                switch (hook.method) {
                case 'find':
                    break;
                case 'get':
                    break;
                case 'create':
                    hook.data = cacheIn(hook.data, options);
                    break;
                case 'update':
                    hook.data = cacheIn(hook.data, options);
                    break;
                case 'remove':
                    break;
                }
            } else {
                switch (hook.method) {
                case 'find':
                    var inDataProp = !!hook.result.data;
                    var results = inDataProp ? hook.result.data : hook.result;
                    results = results.map(function (item) {
                        return cacheOut(item, options);
                    });
                    if (inDataProp) {
                        hook.result.data = results;
                    } else {
                        hook.result = results;
                    }
                    break;
                case 'get':
                    hook.result = cacheOut(hook.result, options);
                    break;
                case 'create':
                    hook.result = cacheOut(hook.result, options);
                    break;
                case 'update':
                    hook.result = cacheOut(hook.result, options);
                    break;
                case 'remove':
                    break;
                }
            }
            return hook;
        };
    };
    return {
        get defaults() {
            return defaults;
        },
        get getCleanObject() {
            return getCleanObject;
        },
        get cacheIn() {
            return cacheIn;
        },
        get cacheOut() {
            return cacheOut;
        },
        get default() {
            return $__default;
        },
        __esModule: true
    };
});