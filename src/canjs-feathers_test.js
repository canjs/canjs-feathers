import QUnit from 'steal-qunit';
import DefineMap from 'can-define/map/';
import DefineList from 'can-define/list/';
import feathers from '../test/feathers-rest';
import Connection from './canjs-feathers';
import fixtureData from '../test/fixtures';
import stache from 'can-stache';
import canEvent from 'can-event';

const Account = DefineMap.extend('Account', {
  seal: false
}, {
  '_id': '*',
  name: {type: 'string'},
  type: {type: 'string'},

  balance: {
    type: 'number'
  },
});

Account.List = DefineList.extend({
  '*': Account,
  limit: 'number',
  skip: 'number',
  total: 'number'
});

const service = new Connection({
  service: feathers.service('v1/accounts'),
  idProp: '_id',
  Map: Account,
  List: Account.List,
  name: 'Account',
});

// ViewModel unit tests
QUnit.module('canjs-feathers');

QUnit.test('Extends the original service, Map, and List', function(assert){

  assert.equal(typeof service.find, 'function', 'Returns the service.');
  assert.equal(typeof service.Map, 'function', 'Adds the Map to the service.');
  assert.equal(typeof service.List, 'function', 'Adds the List to the service.');
  assert.equal(service.name, 'Account', 'Adds the Map name to the service.');
  assert.equal(service.idProp, '_id', 'Adds the idProp to the service.');

  assert.equal(typeof Account.find, 'function', 'Adds the find function to the Map.');
  assert.equal(typeof Account.get, 'function', 'Adds the get function to the Map.');

  let account = new Account({
    name: 'Checking'
  });

  assert.equal(typeof account.save, 'function', 'Adds the save function to map instances.');
  assert.equal(typeof account.patch, 'function', 'Adds the patch function to map instances.');
  assert.equal(typeof account.destroy, 'function', 'Adds the destroy function to map instances.');

  let accounts = new Account.List([]);

  assert.equal(typeof accounts.save, 'function', 'Adds the save function to list instances.');
  assert.equal(typeof accounts.patch, 'function', 'Adds the patch function to list instances.');
  assert.equal(typeof accounts.destroy, 'function', 'Adds the destroy function to list instances.');
});


QUnit.test('Map.find', function(assert){
  const done = assert.async();

  Account.find({}).then(accounts => {
    assert.equal(accounts.length, 3, 'got 3 accounts');
    assert.equal(accounts[0].name, 'Checking');
    let types = accounts.filter(account => {
      return account instanceof Account;
    });
    assert.equal(types.length, 3, 'Fetched data is hydrated by default');
    assert.equal(accounts instanceof Account.List, true, 'The result list was hydrated properly.');
    done();
  });
});

QUnit.test('Map.get', function(assert){
  const done = assert.async();

  Account.get(1).then(account => {
    assert.equal(account.name, 'Checking', 'Got the account.');
    done();
  });
});

QUnit.test('map.save()', function(assert){
  const done = assert.async();

  var account = new Account(fixtureData[0]);
  delete account._id;

  account.save().then(account => {
    assert.equal(account._id, 1, 'map.save() worked for create');
    account.name = 'Moose';
    account.save().then(account => {
      assert.equal(account.name, 'Moose', 'map.save() worked for update');
      done();
    });
  });
});

QUnit.test('map.patch(props)', function(assert){
  const done = assert.async();

  var account = new Account(fixtureData[0]);

  account.patch({name: 'Patchy McPatchface'}).then(account => {
    assert.equal(account._id, 1);
    assert.equal(account.name, 'Patchy McPatchface', 'map.patch() worked');
    done();
  });
});

QUnit.test('map.destroy()', function(assert){
  const done = assert.async();

  var account = new Account(fixtureData[0]);

  account.destroy().then(account => {
    assert.equal(account._id, 1, 'map.destroy() worked');
    done();
  });
});

QUnit.test('Map:created event', function(assert){
  const done = assert.async();

  function handler(ev, data){
    assert.equal(data._id, 1, 'Got the instance in the `created` event.');
    canEvent.off.call(Account, 'created', handler);
    // Account.off('created', handler);
    // assert.ok(Account.off, 'Removed subscription to `created` event.');
    done();
  }

  canEvent.on.call(Account, 'created', handler);

  var account = new Account({
    name: 'Checking',
    balance: 1402.42
  });
  account.save();
});

QUnit.test('Map:updated event', function(assert){
  const done = assert.async();

  function handler(ev, data){
    assert.equal(data._id, 55, 'Got the instance in the `updated` event.');
    canEvent.off.call(Account, 'updated', handler);
    done();
  }

  canEvent.on.call(Account, 'updated', handler);

  var account = new Account({
    _id: 55,
    name: 'Checking',
    balance: 1402.42
  });
  account.save();
});

QUnit.test('Map:patched event', function(assert){
  const done = assert.async();

  function handler(ev, data){
    assert.equal(data._id, 2, 'Got the instance in the `patched` event.');
    assert.equal(data.name, 'Jonas', 'Got the new name in the `patched` event.');
    canEvent.off.call(Account, 'patched', handler);
    done();
  }

  canEvent.on.call(Account, 'patched', handler);

  var account = new Account({
    _id: 2,
    name: 'Checking',
    balance: 1402.42
  });
  account.patch({name: 'Jonas'});
});

QUnit.test('Map:destroyed event', function(assert){
  const done = assert.async();

  function handler(ev, data){
    assert.equal(data._id, 1, 'Got the instance in the `destroyed` event.');
    canEvent.off.call(Account, 'destroyed', handler);
    done();
  }

  canEvent.on.call(Account, 'destroyed', handler);

  var account = new Account({
    _id: 1,
    name: 'Checking',
    balance: 1402.42
  });
  account.destroy();
});

QUnit.test('must pass Map and List constructors', function(assert){
  const Pet = DefineMap.extend('Pet', {
    id: '*'
  });

  assert.throws(function(){
    new Connection({
      service: feathers.service('people'),
      idProp: 'id'
    });
  }, /Map/, 'threw an error when not passing a Map');

  assert.throws(function(){
    new Connection({
      service: feathers.service('people'),
      idProp: 'id',
      Map: Pet
    });
  }, /List/, 'threw an error when not passing a List');
});

QUnit.test('custom id as getter function', function(assert){
  const done = assert.async();

  const Person = DefineMap.extend('Person', {
    seal: false
  }, {
    id: {
      type: 'string',
      get(){
        return `${this.first}${this.last}`;
      }
    },
    first: {type: 'string'},
    last: {type: 'string'},
    idInReponse: 'string'
  });
  Person.List = DefineList.extend({
    '*': Person
  });

  new Connection({
    service: feathers.service('people'),
    idProp: 'id',
    Map: Person,
    name: 'Account',
  });

  var bob = new Person({
    first: 'Bob',
    last: 'Minion'
  });
  bob.save().then(response => {
    assert.equal(response.idInReponse, 'BobMinion', 'Custom id works.');
    done();
  });
});

QUnit.test('lists pull instances from the model store', function(assert){
  const done = assert.async();

  Account.find().then(accountList1 => {
    Account.find().then(accountList2 => {
      assert.equal(accountList1[0] === accountList2[0], true, 'Same instance in both lists.');
      done();
    });
  });
});

QUnit.test('updating stache template from two lists', function(assert){
  const Acct = DefineMap.extend({
    name: 'string'
  });
  Acct.List = DefineList.extend({
    '*': Acct
  });
  var account = new Acct({
    _id: 2,
    name: 'Savings',
    balance: 40.33
  });
  var template = stache('{{name}}')(account);
  assert.equal(template.textContent, 'Savings');
  account.name = 'GoodSavings';
  assert.equal(account.name, 'GoodSavings');
  assert.equal(template.textContent, 'GoodSavings', 'template updated correctly');
});

QUnit.test('Map.find first arg is query object.', function(assert){
  const done = assert.async();
  const Robot = DefineMap.extend('Robot', {
    seal: false
  }, {
    '_id': '*',
    model: {type: 'string'}
  });
  Robot.List = DefineList.extend({
    '*': Robot
  });
  new Connection({
    service: feathers.service('v1/robots'),
    idProp: '_id',
    Map: Robot,
    name: 'Robot',
  });
  Robot.find({model: 'T1000'}).then(response => {
    assert.equal(response[0].model, 'T1000');
    done();
  });
});
