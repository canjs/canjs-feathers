/*canjs-feathers@1.0.0#canjs-feathers*/
'use strict';
var $__can_45_event__, $__hooks_47_hydrate_47___, $__hooks_47_cache_47___, $__hooks_47_translate_45_ids_47___, $__hooks_47_create_45_or_45_update_47___, $__new_45_instance_47_model_45_store__, $__new_45_instance_47_model_45_store_45_cache__;
var canEvent = ($__can_45_event__ = require('can-event'), $__can_45_event__ && $__can_45_event__.__esModule && $__can_45_event__ || { default: $__can_45_event__ }).default;
var hydrate = ($__hooks_47_hydrate_47___ = require('./hooks/hydrate/hydrate.js'), $__hooks_47_hydrate_47___ && $__hooks_47_hydrate_47___.__esModule && $__hooks_47_hydrate_47___ || { default: $__hooks_47_hydrate_47___ }).default;
var cache = ($__hooks_47_cache_47___ = require('./hooks/cache/cache.js'), $__hooks_47_cache_47___ && $__hooks_47_cache_47___.__esModule && $__hooks_47_cache_47___ || { default: $__hooks_47_cache_47___ }).default;
var translateIds = ($__hooks_47_translate_45_ids_47___ = require('./hooks/translate-ids/translate-ids.js'), $__hooks_47_translate_45_ids_47___ && $__hooks_47_translate_45_ids_47___.__esModule && $__hooks_47_translate_45_ids_47___ || { default: $__hooks_47_translate_45_ids_47___ }).default;
var createOrUpdate = ($__hooks_47_create_45_or_45_update_47___ = require('./hooks/create-or-update/create-or-update.js'), $__hooks_47_create_45_or_45_update_47___ && $__hooks_47_create_45_or_45_update_47___.__esModule && $__hooks_47_create_45_or_45_update_47___ || { default: $__hooks_47_create_45_or_45_update_47___ }).default;
var setupModelStore = ($__new_45_instance_47_model_45_store__ = require('./new-instance/model-store.js'), $__new_45_instance_47_model_45_store__ && $__new_45_instance_47_model_45_store__.__esModule && $__new_45_instance_47_model_45_store__ || { default: $__new_45_instance_47_model_45_store__ }).default;
var setupModelStoreWithCache = ($__new_45_instance_47_model_45_store_45_cache__ = require('./new-instance/model-store-cache.js'), $__new_45_instance_47_model_45_store_45_cache__ && $__new_45_instance_47_model_45_store_45_cache__.__esModule && $__new_45_instance_47_model_45_store_45_cache__ || { default: $__new_45_instance_47_model_45_store_45_cache__ }).default;
function ObservableService() {
    var options = arguments[0] !== void 0 ? arguments[0] : {};
    if (!options.Map) {
        throw new Error('Please provide a Map Constructor.');
    }
    if (!options.Map.List && !options.List) {
        throw new Error('Please provide a List Constructor.');
    }
    if (!options.service) {
        throw new Error('Please provide a feathers service.');
    }
    if (!options.idProp) {
        throw new Error('Please provide an idProp.');
    }
    var name = options.name || options.Map.constructor.prototype.name;
    if (name === 'Map') {
        if (steal) {
        }
    }
    var service = options.service;
    delete options.service;
    if (!service.before || !service.after) {
        throw new Error('The feathers-hooks plugin is required.');
    }
    if (options.cache) {
        options.cacheService = options.cache.service;
        delete options.cache.service;
        Object.assign(options, {
            cacheOptions: {
                remoteIdProp: options.idProp,
                storedRemoteIdProp: options.cache.storedRemoteIdProp || '__remoteId',
                cacheIdProp: options.cache.cacheIdProp || '__cacheId',
                storedCacheIdProp: options.cache.storedCacheIdProp
            }
        });
    }
    var Map = options.Map;
    var List = Map.List || options.List;
    var defaults = {
        idProp: undefined,
        modelName: name,
        Map: Map,
        List: List
    };
    Object.assign(service, defaults, options);
    Object.assign(Map, {
        idProp: service.idProp,
        store: {},
        find: function (query) {
            if (service.cacheService && query.$fromCache) {
                delete query.$fromCache;
                return service.cacheService.find({ query: query });
            }
            return service.find({ query: query });
        },
        get: function (id) {
            var params = arguments[1] !== void 0 ? arguments[1] : {};
            if (service.cacheService && params.$fromCache) {
                delete params.$fromCache;
                return service.cacheService.get(id, params);
            }
            return service.get(id, params);
        }
    }, canEvent);
    var _newInstance = Map.newInstance;
    Map.newInstance = function (props) {
        if (typeof service.newInstanceFn === 'function') {
            return service.newInstanceFn.call(this, props, Map, service, _newInstance);
        }
        if (service.cacheService) {
            return setupModelStoreWithCache.call(this, props, Map, service, _newInstance);
        }
        return setupModelStore.call(this, props, Map, service, _newInstance);
    };
    if (service.cacheService) {
        Object.assign(Map, {
            cache: {
                find: function (query) {
                    return service.cacheService.find({ query: query });
                },
                get: function (id, params) {
                    return service.cacheService.get(id, params);
                }
            }
        });
        service.cacheService.before({
            all: [translateIds(service.cacheOptions)],
            create: [createOrUpdate(service.cacheOptions)]
        });
        service.cacheService.after({
            all: [
                translateIds(service.cacheOptions),
                hydrate({
                    Map: Map,
                    List: List
                })
            ]
        });
        Object.assign(Map.constructor.prototype, {
            cache: function () {
                return service.cacheService.create(this.serialize()).then(function (cachedInstance) {
                    Map.dispatch('cached', [cachedInstance]);
                    return cachedInstance;
                });
            }
        });
    }
    Object.assign(Map.constructor.prototype, {
        save: function () {
            var id = this[Map.idProp];
            if (id) {
                return service.update(id, this.serialize()).then(function (response) {
                    Map.dispatch('updated', [response]);
                    return response;
                });
            } else {
                return service.create(this.serialize()).then(function (response) {
                    Map.dispatch('created', [response]);
                    return response;
                });
            }
            return;
        },
        patch: function () {
            var props = arguments[0] !== void 0 ? arguments[0] : {};
            var id = this[Map.idProp];
            return service.patch(id, props).then(function (response) {
                Map.dispatch('patched', [response]);
                return response;
            });
        },
        destroy: function () {
            var id = this[Map.idProp];
            if (id !== undefined) {
                return service.remove(id).then(function (response) {
                    Map.dispatch('destroyed', [response]);
                    return response;
                });
            }
            return Promise.resolve(this);
        }
    });
    Object.assign(service.List.constructor.prototype, {
        save: function () {
            return true;
        },
        patch: function () {
            return true;
        },
        destroy: function () {
            return true;
        }
    });
    service.before({
        all: [],
        find: [cache.find()],
        get: [cache.get(service.cacheOptions)],
        create: [],
        update: [],
        patch: [],
        remove: []
    });
    service.after({
        all: [hydrate()],
        find: [cache.merge()],
        get: [cache.mergeOne()],
        create: [cache.mergeOne()],
        update: [cache.mergeOne()],
        patch: [cache.mergeOne()],
        remove: [cache.remove(service.cacheOptions)]
    });
    return service;
}
var $__default = ObservableService;
Object.defineProperties(module.exports, {
    default: {
        get: function () {
            return $__default;
        }
    },
    __esModule: { value: true }
});