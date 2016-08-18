import canEvent from 'can-event';
import hydrate from './hooks/hydrate/';
import deepAssign from 'can-util/js/deep-assign/deep-assign';

export default function ObservableService(options = {}){
  if (!options.Map) {
    throw new Error('Please provide a Map Constructor.');
  }
  if (!options.Map.List && !options.List) {
    throw new Error('Please provide a List Constructor.');
  }
  if (!options.service) {
    throw new Error('Please provide a feathers service.');
  }

  let name = options.name || options.Map.constructor.prototype.name;
  if (name === 'Map') {
    steal.dev.log('Debugging will be easier if you give your Map a name.');
  }

  const service = options.service;
  delete options.service;

  if (!service.before || !service.after) {
    throw new Error('The feathers-hooks plugin is required.');
  }

  const Map = options.Map;
  const List = Map.List || options.List;
  const defaults = {
    idProp: '_id',
    name: name,
    Map,
    List,
    store: {}
  };
  Object.assign(service, defaults, options);


  // store a reference to the original newInstance function
  var _newInstance = Map.newInstance;

  // override the Map's newInstance function
  Map.newInstance = function(props) {
    let id = props[service.idProp];
    if (id) {
      // look in the service.store to see if the object already exists
      var cachedInst = service.store[id];
      if(cachedInst) {
        steal.dev.log(`Updating ${service.name}`);
        cachedInst = deepAssign(cachedInst, props);
        return cachedInst;
      }
    }

    //otherwise call the original newInstance function and return a new instance of Person.
    var newInst = _newInstance.apply(this, arguments);
    if (id) {
      service.store[id] = newInst;
    }
    return newInst;
  };

  // Extend the Map
  Object.assign(Map, {
    idProp: options.idProp,

    find(query){
      return service.find({query});
    },

    get(id, params){
      return service.get(id, params);
    }
  }, canEvent);

  // Extend the Map instances.
  Object.assign(Map.constructor.prototype, {

    /**
     * When instances are saved, if they have an `idProp` already, run `service.update`
     * on the instance and trigger the `updated` event on the Map when the data returns.
     * If there is no `idProp`, run `service.create` and trigger the `created` event.
     * @return {[type]} [description]
     */
    save(){
      let id = this[Map.idProp];
      if (id) {
        return service.update(id, this.serialize()).then(response => {
          Map.dispatch('updated', [response]);
          return response;
        });
      } else {
        return service.create(this.serialize()).then(response => {
          Map.dispatch('created', [response]);
          return response;
        });
      }
      return ;
    },

    /**
     * `patch()` currently requires passing in a props object.  In the future,
     * we should update it to watch for props that change and mark them as dirty,
     * then it can only send the dirty props.  For now, passing the props will
     * send those props as the patch request.
     */
    patch(props = {}){
      let id = this[Map.idProp];
      return service.patch(id, props).then(response => {
        Map.dispatch('patched', [response]);
        return response;
      });
    },

    destroy(){
      let id = this[Map.idProp];
      if (id) {
        return service.remove(id).then(response => {
          Map.dispatch('destroyed', [response]);
          return response;
        });
      }
      return Promise.resolve(this);
    }
  });

  // Extend the List instances
  Object.assign(service.List.constructor.prototype, {
    save(){
      return true;
    },
    patch(){
      return true;
    },
    destroy(){
      return true;
    }
  });


  service.after({
    all: [
      hydrate()
    ]
  });

  return service;
}
