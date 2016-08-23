import deepAssign from 'can-util/js/deep-assign/deep-assign';

export default function(props, Map, service, parentNewInstanceFn){
  let id = props[service.idProp];

  // If there's an id, look in the Map.store to see if the object already exists
  if (id !== null && id !== undefined) {
    var cachedInst = Map.store[id];
    if(cachedInst) {
      // Copy all new attributes to the cached instance and return it.
      cachedInst = deepAssign(cachedInst, props);
      return cachedInst;
    }
  }

  // There was no id, call the original newInstance function and return a new
  // instance of Person.
  var newInst = parentNewInstanceFn.call(this, props);
  if (id !== null && id !== undefined) {
    Map.store[id] = newInst;
  }
  return newInst;
}
