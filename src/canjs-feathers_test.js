import QUnit from 'steal-qunit';
import DefineMap from 'can-define/map/';
import DefineList from 'can-define/list/';
import feathers from '../test/feathers-rest';
import Connection from './canjs-feathers';
import stache from 'can-stache';
import canEvent from 'can-event';

const Account = DefineMap.extend('Account', {
  seal: false
}, {
  '_id': '*',
  name: {
    type: 'string'
  },
  type: {
    type: 'string'
  },

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

const accountService = new Connection({
  service: feathers.service('v1/accounts'),
  idProp: '_id',
  Map: Account,
  List: Account.List,
  name: 'Account',
});

function resetAccountService() {
  accountService.store = {
    1: {
      _id: 1,
      name: 'Checking',
      balance: 1000.55
    },
    2: {
      _id: 2,
      name: 'Savings',
      balance: 40.33
    },
    3: {
      _id: 3,
      name: 'Kids Savings',
      balance: 95000.01
    }
  };
  accountService._uId = 4;
}


const Robot = DefineMap.extend('Robot', {
  seal: false
}, {
  '_id': '*',
  model: {
    type: 'string'
  }
});
Robot.List = DefineList.extend({
  '*': Robot
});
const robotService = new Connection({
  service: feathers.service('v1/robots'),
  cache: {
    service: feathers.service('v1/robots/_cache'),
    cacheIdProp: 'id'
  },
  idProp: '_id',
  Map: Robot,
  name: 'Robot',
});

function resetRobotService() {
  // Make sure the memoryStore is cleared before beginning the test.
  robotService.cacheService.store = {};
  robotService._uId = 0;
}


// ViewModel unit tests
QUnit.module('canjs-feathers');

QUnit.test('Extends the original service, Map, and List', function(assert) {

  resetAccountService();

  assert.equal(typeof accountService.find, 'function', 'Returns the service.');
  assert.equal(typeof accountService.Map, 'function', 'Adds the Map to the service.');
  assert.equal(typeof accountService.List, 'function', 'Adds the List to the service.');
  assert.equal(accountService.name, 'Account', 'Adds the Map name to the service.');
  assert.equal(accountService.idProp, '_id', 'Adds the idProp to the service.');

  assert.equal(Account.cache, undefined, 'No cache object is available by default.');
  assert.deepEqual(Account.store, {}, 'Map.store is setup & empty.');
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


QUnit.test('Map.find', function(assert) {
  const done = assert.async();
  resetAccountService();

  Account.find({}).then(accounts => {
    assert.equal(accounts.length, 3, 'got 3 accounts');
    assert.equal(accounts[0].name, 'Checking');
    let types = accounts.filter(account => {
      return account instanceof Account;
    });
    assert.equal(types.length, 3, 'Fetched data is hydrated by default');
    assert.equal(accounts instanceof Account.List, true,
      'The result list was hydrated properly.');
    done();
  });
});

QUnit.test('Map.get', function(assert) {
  const done = assert.async();
  resetAccountService();

  Account.get(1).then(account => {
    assert.equal(account.name, 'Checking', 'Got the account.');
    done();
  });
});

QUnit.test('map.save()', function(assert) {
  const done = assert.async();
  resetAccountService();

  var account = new Account({
    name: 'Phishing Fund',
    type: 'Checking'
  });

  account.save().then(account => {
    assert.deepEqual(account.get(), {
      _id: 4,
      name: 'Phishing Fund',
      type: 'Checking'
    }, 'map.save() worked for create');

    account.name = 'Moose';
    account.save().then(account => {
      assert.deepEqual(account.get(), {
        _id: 4,
        name: 'Moose',
        type: 'Checking'
      }, 'map.save() worked for update');
      done();
    });
  });
});

QUnit.test('map.patch(props)', function(assert) {
  const done = assert.async();
  resetAccountService();

  Account.get(1).then(account => {
    account.patch({
      name: 'Patchy McPatchface'
    }).then(account => {
      assert.equal(account._id, 1, 'id stayed the same.');
      assert.equal(account.name, 'Patchy McPatchface', 'map.patch() worked');
      done();
    });
  });
});

QUnit.test('map.destroy()', function(assert) {
  const done = assert.async();
  resetAccountService();

  Account.find({}).then(accounts => {
    accounts[1].destroy().then(account => {
      assert.equal(account._id, 2, 'map.destroy() worked');
      done();
    });
  });
});

QUnit.test('Map:created event', function(assert) {
  const done = assert.async();
  resetAccountService();

  function handler(ev, data) {
    assert.equal(data._id, 4, 'Got the instance in the `created` event.');
    canEvent.off.call(Account, 'created', handler);
    Account.off('created', handler);
    assert.ok(Account.off, 'Removed subscription to `created` event.');
    done();
  }

  canEvent.on.call(Account, 'created', handler);

  var account = new Account({
    name: 'Checking',
    balance: 1402.42
  });
  account.save();
});

QUnit.test('Map:updated event', function(assert) {
  const done = assert.async();
  resetAccountService();

  function handler(ev, data) {
    assert.equal(data._id, 3, 'Got the instance in the `updated` event.');
    canEvent.off.call(Account, 'updated', handler);
    done();
  }

  canEvent.on.call(Account, 'updated', handler);

  Account.get(3).then(account => {
    account.save();
  });
});

QUnit.test('Map:patched event', function(assert) {
  const done = assert.async();
  resetAccountService();

  function handler(ev, data) {
    assert.equal(data._id, 2, 'Got the instance in the `patched` event.');
    assert.equal(data.name, 'Jonas',
      'Got the new name in the `patched` event.');
    canEvent.off.call(Account, 'patched', handler);
    done();
  }

  canEvent.on.call(Account, 'patched', handler);

  Account.get(2).then(account => {
    account.patch({
      name: 'Jonas'
    });
  });
});

QUnit.test('Map:destroyed event', function(assert) {
  const done = assert.async();
  resetAccountService();

  function handler(ev, data) {
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

QUnit.test('must pass Map and List constructors', function(assert) {
  const Pet = DefineMap.extend('Pet', {
    id: '*'
  });

  assert.throws(function() {
    new Connection({
      service: feathers.service('people'),
      idProp: 'id'
    });
  }, /Map/, 'threw an error when not passing a Map');

  assert.throws(function() {
    new Connection({
      service: feathers.service('people'),
      idProp: 'id',
      Map: Pet
    });
  }, /List/, 'threw an error when not passing a List');
});

QUnit.test('lists pull instances from the model store', function(assert) {
  const done = assert.async();
  resetAccountService();

  Account.find().then(accountList1 => {
    Account.find().then(accountList2 => {
      assert.equal(accountList1[0] === accountList2[0], true,
        'Same instance in both lists.');
      done();
    });
  });
});

QUnit.test('updating stache template from two lists', function(assert) {
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

QUnit.test('cacheService tests.', function(assert) {
  const done = assert.async();
  resetRobotService();

  assert.ok(Robot.cache, 'Cache object available on map');
  assert.ok(Robot.cache.find, 'find method was available on Map.cache.');
  assert.ok(Robot.cache.get, 'find method was available on Map.cache.');

  // Create and save a new Robot instance, then query the cache for all records.
  new Robot({
    model: 'T1000'
  })
  .save()
  .then(response => {
    assert.equal(response._id, 0, 'got the correct id back');
    assert.equal(response.model, 'T1000', 'got the correct robot model back');

    return Robot.cache.find({});

  // Check the response from the cache query to see if we got the Robot instance
  // that we created earlier.  Then create an instance directly in the cacheService.
  }).then(response => {
    assert.ok(response.get, 'The cacheService hydrates into DefineMaps & DefineLists.');
    assert.deepEqual(response[0].get(), {
      _id: 0,
      __cacheId: 1,
      model: 'T1000'
    }, 'correct ids set on the data');

    return robotService.cacheService.create({
      model: 'T8000'
    });

  // Check that we were able to create a model instance, then run instance.cache()
  // which is the basically the same as `cacheService.create`.
  }).then(instance => {
    assert.ok(instance instanceof Robot, 'got Model instance');
    assert.equal(instance._id, undefined, 'no remote _id is assigned to the data');
    assert.equal(instance.__cacheId, 2, 'the data has a __cacheId');

    return new Robot({
      model: 'T9000'
    }).cache();

  // Verify that the new instance was saved to the cache.
  }).then(instance => {
    assert.ok(instance instanceof Robot, 'got Model instance');
    assert.equal(instance._id, undefined, 'no remote _id is assigned to the data');
    assert.equal(instance.__cacheId, 3, 'the data has a __cacheId');
    done();
  });
});
