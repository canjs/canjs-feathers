import DefineMap from 'can-define/map/';
import DefineList from 'can-define/list/';
import canEvent from 'can-event';
import hydrate from './hooks/hydrate/';

export default function ObservableService(options = {}){
  if (!options.Map) {
    throw new Error('Please provide a Map Constructor.');
  }
  if (!options.service) {
    throw new Error('You must pass a feathers service.');
  }

  const service = options.service;
  delete options.service;

  if (!service.before || !service.after) {
    throw new Error('The feathers-hooks plugin is required.');
  }

  const Map = options.Map;
  const defaults = {
    idProp: '_id',
    name: undefined,
    List: DefineList.extend({
      '*': Map
    })
  };
  Object.assign(service, defaults, options);


  // Extend the Map
  Object.assign(Map, {
    idProp: options.idProp,

    find(params){
      return service.find(params);
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

    patch(){
      return false;
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
  Object.assign(options.List.constructor.prototype, {
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
