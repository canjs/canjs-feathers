/*[global-shim-start]*/
(function(exports, global, doEval){ // jshint ignore:line
	var origDefine = global.define;

	var get = function(name){
		var parts = name.split("."),
			cur = global,
			i;
		for(i = 0 ; i < parts.length; i++){
			if(!cur) {
				break;
			}
			cur = cur[parts[i]];
		}
		return cur;
	};
	var set = function(name, val){
		var parts = name.split("."),
			cur = global,
			i, part, next;
		for(i = 0; i < parts.length - 1; i++) {
			part = parts[i];
			next = cur[part];
			if(!next) {
				next = cur[part] = {};
			}
			cur = next;
		}
		part = parts[parts.length - 1];
		cur[part] = val;
	};
	var useDefault = function(mod){
		if(!mod || !mod.__esModule) return false;
		var esProps = { __esModule: true, "default": true };
		for(var p in mod) {
			if(!esProps[p]) return false;
		}
		return true;
	};
	var modules = (global.define && global.define.modules) ||
		(global._define && global._define.modules) || {};
	var ourDefine = global.define = function(moduleName, deps, callback){
		var module;
		if(typeof deps === "function") {
			callback = deps;
			deps = [];
		}
		var args = [],
			i;
		for(i =0; i < deps.length; i++) {
			args.push( exports[deps[i]] ? get(exports[deps[i]]) : ( modules[deps[i]] || get(deps[i]) )  );
		}
		// CJS has no dependencies but 3 callback arguments
		if(!deps.length && callback.length) {
			module = { exports: {} };
			var require = function(name) {
				return exports[name] ? get(exports[name]) : modules[name];
			};
			args.push(require, module.exports, module);
		}
		// Babel uses the exports and module object.
		else if(!args[0] && deps[0] === "exports") {
			module = { exports: {} };
			args[0] = module.exports;
			if(deps[1] === "module") {
				args[1] = module;
			}
		} else if(!args[0] && deps[0] === "module") {
			args[0] = { id: moduleName };
		}

		global.define = origDefine;
		var result = callback ? callback.apply(null, args) : undefined;
		global.define = ourDefine;

		// Favor CJS module.exports over the return value
		result = module && module.exports ? module.exports : result;
		modules[moduleName] = result;

		// Set global exports
		var globalExport = exports[moduleName];
		if(globalExport && !get(globalExport)) {
			if(useDefault(result)) {
				result = result["default"];
			}
			set(globalExport, result);
		}
	};
	global.define.orig = origDefine;
	global.define.modules = modules;
	global.define.amd = true;
	ourDefine("@loader", [], function(){
		// shim for @@global-helpers
		var noop = function(){};
		return {
			get: function(){
				return { prepareGlobal: noop, retrieveGlobal: noop };
			},
			global: global,
			__exec: function(__load){
				doEval(__load.source, global);
			}
		};
	});
}
)({},window,function(__$source__, __$global__) { // jshint ignore:line
	eval("(function() { " + __$source__ + " \n }).call(__$global__);");
}
)
/*canjs-feathers@1.0.0#hooks/hydrate/hydrate*/
define('canjs-feathers/hooks/hydrate/hydrate', [], function () {
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
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*canjs-feathers@1.0.0#hooks/cache/find*/
define('canjs-feathers/hooks/cache/find', [], function () {
    'use strict';
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            if (!this.cacheService || hook.params.query && hook.params.query.$skipCache) {
                return hook;
            }
            var cacheService = this.cacheService;
            return new Promise(function (resolve, reject) {
                function processRequest(response) {
                    var gotRecords = !response.data ? !!response.length : !!response.data.length;
                    if (gotRecords || hook.params.$fromCache) {
                        hook.result = response;
                        hook.params.resultsCameFromCache = true;
                    }
                    resolve(hook);
                }
                cacheService.find(hook.params).then(function (response) {
                    return processRequest(response);
                }).catch(function (e) {
                    console.log('Error message.', hook.data, e);
                    reject(e);
                });
            });
        };
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*canjs-feathers@1.0.0#hooks/cache/get*/
define('canjs-feathers/hooks/cache/get', [], function () {
    'use strict';
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            if (!this.cacheService || hook.params && hook.params.$skipCache) {
                return hook;
            }
            var cacheService = this.cacheService;
            return new Promise(function (resolve, reject) {
                var $__2;
                function processRequest(response) {
                    var gotRecords = !response.data ? !!response.length : !!response.data.length;
                    if (gotRecords || hook.params.$fromCache) {
                        var result = !response.data ? response[0] : response.data[0];
                        if (result) {
                            hook.result = result.get();
                            hook.params.resultsCameFromCache = true;
                        }
                    }
                    resolve(hook);
                }
                var params = {
                    query: ($__2 = {}, Object.defineProperty($__2, options.storedRemoteIdProp, {
                        value: hook.id,
                        configurable: true,
                        enumerable: true,
                        writable: true
                    }), $__2)
                };
                cacheService.find(params).then(function (response) {
                    return processRequest(response);
                }).catch(function (e) {
                    console.log('Error message.', hook.data, e);
                    reject(e);
                });
            });
        };
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*canjs-feathers@1.0.0#hooks/cache/remove*/
define('canjs-feathers/hooks/cache/remove', [], function () {
    'use strict';
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            var $__2;
            if (!this.cacheService || hook.params.$fromCache) {
                return hook;
            }
            var cacheService = this.cacheService;
            var params = {
                query: ($__2 = {}, Object.defineProperty($__2, options.storedRemoteIdProp, {
                    value: hook.id,
                    configurable: true,
                    enumerable: true,
                    writable: true
                }), $__2)
            };
            return new Promise(function (resolve, reject) {
                cacheService.remove(null, params).then(function () {
                    resolve(hook);
                }).catch(function (e) {
                    console.log('Error message.', hook.data, e);
                    reject(e);
                });
            });
        };
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*canjs-feathers@1.0.0#hooks/cache/merge*/
define('canjs-feathers/hooks/cache/merge', ['feathers-commons/lib/utils'], function ($__0) {
    'use strict';
    if (!$__0 || !$__0.__esModule)
        $__0 = { default: $__0 };
    var createSorter = $__0.sorter;
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            var $__3;
            if (!this.cacheService || hook.params.query.$fromCache) {
                return hook;
            }
            var idProp = this.idProp, $sort = hook.params.query && hook.params.query.$sort, sorter = $sort ? createSorter($sort) : createSorter(($__3 = {}, Object.defineProperty($__3, this.idProp, {
                    value: 1,
                    configurable: true,
                    enumerable: true,
                    writable: true
                }), $__3)), service = this, cacheService = this.cacheService, resultsCameFromCache = hook.params.resultsCameFromCache;
            return new Promise(function (resolve, reject) {
                function processResult(response) {
                    var remoteData = !response.data ? response : response.data;
                    if (resultsCameFromCache) {
                        var cachedData = !hook.result.data ? hook.result : hook.result.data;
                        var cacheMap = {};
                        var errored = false;
                        cachedData.forEach(function (item) {
                            if (!item[idProp]) {
                                console.error('An idProp of \'' + idProp + '\' was not found on the ' + service.modelName + ' instance. Did you set the wrong idProp on the connection?');
                                errored = true;
                            } else {
                                cacheMap[item[idProp]] = item;
                            }
                        });
                        remoteData.forEach(function (item) {
                            if (!cacheMap[item[idProp]] && !errored) {
                                cachedData.push(item);
                                cacheService.create(item);
                            }
                        });
                        if (sorter) {
                            cachedData.sort(sorter);
                        }
                    } else {
                        var requests = remoteData.map(function (item) {
                            return cacheService.create(item);
                        });
                        Promise.all(requests).then(function (responses) {
                            console.log(responses);
                            return resolve(hook);
                        });
                    }
                }
                if (resultsCameFromCache) {
                    var params = Object.assign({}, hook.params);
                    delete params.resultsCameFromCache;
                    params.query.$skipCache = true;
                    service.find(params).then(function (response) {
                        return processResult(response);
                    }).catch(function (e) {
                        console.log('Error message.', hook.data, e);
                        reject(e);
                    });
                    resolve(hook);
                } else {
                    processResult(hook.result);
                }
            });
        };
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*canjs-feathers@1.0.0#hooks/cache/merge-one*/
define('canjs-feathers/hooks/cache/merge-one', [], function () {
    'use strict';
    var defaults = {};
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        return function (hook) {
            if (!this.cacheService) {
                return hook;
            }
            var service = this, cacheService = this.cacheService, resultsCameFromCache = hook.params.resultsCameFromCache;
            return new Promise(function (resolve, reject) {
                function processResult(response) {
                    if (resultsCameFromCache) {
                        return resolve(hook);
                    } else {
                        cacheService.create(response.get()).then(function () {
                            return resolve(hook);
                        }).catch(function (err) {
                            console.log(err);
                        });
                    }
                }
                if (resultsCameFromCache) {
                    var params = Object.assign({}, hook.params);
                    delete params.resultsCameFromCache;
                    params.$skipCache = true;
                    service.get(hook.id, params).then(function (response) {
                        return processResult(response);
                    }).catch(function (e) {
                        console.log('Error message.', hook.data, e);
                        reject(e);
                    });
                    resolve(hook);
                } else {
                    processResult(hook.result);
                }
            });
        };
    };
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*canjs-feathers@1.0.0#hooks/cache/cache*/
define('canjs-feathers/hooks/cache/cache', [
    'canjs-feathers/hooks/cache/find',
    'canjs-feathers/hooks/cache/get',
    'canjs-feathers/hooks/cache/remove',
    'canjs-feathers/hooks/cache/merge',
    'canjs-feathers/hooks/cache/merge-one'
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
/*canjs-feathers@1.0.0#hooks/translate-ids/translate-ids*/
define('canjs-feathers/hooks/translate-ids/translate-ids', [], function () {
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
/*canjs-feathers@1.0.0#hooks/create-or-update/create-or-update*/
define('canjs-feathers/hooks/create-or-update/create-or-update', ['can-util/js/deep-assign/deep-assign'], function ($__0) {
    'use strict';
    if (!$__0 || !$__0.__esModule)
        $__0 = { default: $__0 };
    var deepAssign = $__0.default;
    var defaults = { remoteIdProp: undefined };
    var $__default = function (options) {
        options = Object.assign({}, defaults, options);
        if (!options.remoteIdProp) {
            throw new Error('The remoteIdProp (for the remote service) must be provided.');
        }
        return function (hook) {
            var service = this;
            return new Promise(function (resolve, reject) {
                var $__4, $__5;
                var params = { query: { $or: [] } };
                var __cacheId = hook.data[options.storedCacheIdProp];
                if (__cacheId !== null && __cacheId !== undefined) {
                    params.query.$or.push(($__4 = {}, Object.defineProperty($__4, options.storedCacheIdProp, {
                        value: hook.data[options.storedCacheIdProp],
                        configurable: true,
                        enumerable: true,
                        writable: true
                    }), $__4));
                }
                var _id = hook.data[options.storedRemoteIdProp];
                if (_id !== null && _id !== undefined) {
                    params.query.$or.push(($__5 = {}, Object.defineProperty($__5, options.storedRemoteIdProp, {
                        value: hook.data[options.storedRemoteIdProp],
                        configurable: true,
                        enumerable: true,
                        writable: true
                    }), $__5));
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
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*canjs-feathers@1.0.0#new-instance/model-store*/
define('canjs-feathers/new-instance/model-store', ['can-util/js/deep-assign/deep-assign'], function ($__0) {
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
/*canjs-feathers@1.0.0#new-instance/model-store-cache*/
define('canjs-feathers/new-instance/model-store-cache', ['can-util/js/deep-assign/deep-assign'], function ($__0) {
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
/*canjs-feathers@1.0.0#canjs-feathers*/
define('canjs-feathers', [
    'can-event',
    'canjs-feathers/hooks/hydrate/hydrate',
    'canjs-feathers/hooks/cache/cache',
    'canjs-feathers/hooks/translate-ids/translate-ids',
    'canjs-feathers/hooks/create-or-update/create-or-update',
    'canjs-feathers/new-instance/model-store',
    'canjs-feathers/new-instance/model-store-cache'
], function ($__0, $__2, $__4, $__6, $__8, $__10, $__12) {
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
    if (!$__10 || !$__10.__esModule)
        $__10 = { default: $__10 };
    if (!$__12 || !$__12.__esModule)
        $__12 = { default: $__12 };
    var canEvent = $__0.default;
    var hydrate = $__2.default;
    var cache = $__4.default;
    var translateIds = $__6.default;
    var createOrUpdate = $__8.default;
    var setupModelStore = $__10.default;
    var setupModelStoreWithCache = $__12.default;
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
    return {
        get default() {
            return $__default;
        },
        __esModule: true
    };
});
/*[global-shim-end]*/
(function(){ // jshint ignore:line
	window._define = window.define;
	window.define = window.define.orig;
}
)();