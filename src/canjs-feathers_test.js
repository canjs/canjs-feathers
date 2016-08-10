import QUnit from 'steal-qunit';
import DefineMap from 'can-define/map/';
import DefineList from 'can-define/list/';
import feathers from '../test/feathers-rest';
import DoneService from './canjs-feathers';
import accountFixtureData from '../test/fixtures.accounts';

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

const service = new DoneService({
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

  var account = new Account(accountFixtureData[0]);
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

QUnit.test('map.destroy()', function(assert){
  const done = assert.async();

  var account = new Account(accountFixtureData[0]);

  account.destroy().then(account => {
    assert.equal(account._id, 1, 'map.destroy() worked');
    done();
  });
});

QUnit.test('Map:created event', function(assert){
  const done = assert.async();

  function handler(ev, data){
    assert.equal(data._id, 1, 'Got the instance in the `created` event.');
    Account.off('created', handler);
    assert.ok(Account.off, 'Removed subscription to `created` event.');
    done();
  }

  Account.on('created', handler);
  assert.ok(Account.on, 'Subscribed to `created` event.');

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
    Account.off('updated', handler);
    assert.ok(Account.off, 'Removed subscription to `updated` event.');
    done();
  }

  Account.on('updated', handler);
  assert.ok(Account.on, 'Subscribed to `updated` event.');

  var account = new Account({
    _id: 55,
    name: 'Checking',
    balance: 1402.42
  });
  account.save();
});

QUnit.test('Map:destroyed event', function(assert){
  const done = assert.async();

  function handler(ev, data){
    assert.equal(data._id, 1, 'Got the instance in the `destroyed` event.');
    Account.off('destroyed', handler);
    assert.ok(Account.off, 'Removed subscription to `destroyed` event.');
    done();
  }

  Account.on('destroyed', handler);
  assert.ok(Account.on, 'Subscribed to `destroyed` event.');

  var account = new Account({
    _id: 1,
    name: 'Checking',
    balance: 1402.42
  });
  account.destroy();
});
