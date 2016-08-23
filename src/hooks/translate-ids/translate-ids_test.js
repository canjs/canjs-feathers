import QUnit from 'steal-qunit';
import DefineMap from 'can-define/map/';
import {getCleanObject} from './translate-ids';
import {defaults} from './translate-ids';
import {cacheIn} from './translate-ids';
import {cacheOut} from './translate-ids';

// ViewModel unit tests
QUnit.module('translate-ids: getCleanObject()');

QUnit.test('Converts Maps to objects', function(assert) {
  var Account = DefineMap.extend({
    name: 'string'
  });
  var account = new Account({
    name: 'Checking'
  });
  var accountObj = getCleanObject(account);
  assert.equal(accountObj.serialize, undefined, 'no serialize method');
  assert.equal(accountObj.get, undefined, 'no get method');
  assert.equal(accountObj.name, 'Checking', 'got same data back.');
});

QUnit.test('Returns a copy of objects', function(assert) {
  var account = {
    name: 'Checking'
  };
  var accountObj = getCleanObject(account);
  assert.notEqual(accountObj, account, 'got a new object back');
  assert.equal(accountObj.name, 'Checking', 'got same data back.');
});



QUnit.module('translate-ids: cacheIn()');

QUnit.test('Requires an options object', function(assert) {
  var Account = DefineMap.extend({
    name: 'string'
  });
  var account = new Account({
    name: 'Checking'
  });
  assert.throws(function(){
    cacheIn(account);
  }, 'Running cacheIn without an options param threw an error');
});

QUnit.test('converts Map to object', function(assert) {
  var Account = DefineMap.extend({
    name: 'string'
  });
  var account = new Account({
    name: 'Checking'
  });
  var obj = cacheIn(account, defaults);
  assert.deepEqual(obj, {
    name: 'Checking',
    __remoteId: undefined
  }, 'Object has the expected params.');
});

QUnit.test('Pass object without ids', function(assert) {
  var account = {
    name: 'Checking'
  };
  var obj = cacheIn(account, defaults);
  assert.deepEqual(obj, {
    name: 'Checking',
    __remoteId: undefined
  }, 'Object has the expected params.');
});

QUnit.test('Pass object with _id', function(assert) {
  var account = {
    _id: 1,
    name: 'Checking'
  };
  var options = Object.assign({}, defaults, {
    remoteIdProp: '_id',
    cacheIdProp: 'id'
  });
  var obj = cacheIn(account, options);
  assert.deepEqual(obj, {
    name: 'Checking',
    __remoteId: 1
  }, 'Object has the expected params.');
});

QUnit.test('Pass object with __cacheId', function(assert) {
  var account = {
    __cacheId: 3,
    name: 'Checking'
  };
  var options = Object.assign({}, defaults, {
    remoteIdProp: '_id',
    cacheIdProp: 'id'
  });
  var obj = cacheIn(account, options);
  assert.deepEqual(obj, {
    name: 'Checking',
    __remoteId: undefined,
    id: 3,
  }, 'Object has the expected params.');
});

QUnit.test('Pass object with _id and __cacheId', function(assert) {
  var account = {
    _id: 1,
    __cacheId: 3,
    name: 'Checking'
  };
  var options = Object.assign({}, defaults, {
    remoteIdProp: '_id',
    cacheIdProp: 'id'
  });
  var obj = cacheIn(account, options);
  assert.deepEqual(obj, {
    name: 'Checking',
    __remoteId: 1,
    id: 3,
  }, 'Object has the expected params.');
});


QUnit.module('translate-ids: cacheOut()');

QUnit.test('Requires an options object', function(assert) {
  var Account = DefineMap.extend({
    name: 'string'
  });
  var account = new Account({
    name: 'Checking'
  });
  assert.throws(function(){
    cacheOut(account);
  }, 'Running cacheOut without an options param threw an error');
});

QUnit.test('Pass object with id', function(assert) {
  var account = {
    id: 1,
    __remoteId: undefined,
    name: 'Checking'
  };
  var options = Object.assign({}, defaults, {
    remoteIdProp: '_id',
    cacheIdProp: 'id'
  });
  var obj = cacheOut(account, options);
  assert.deepEqual(obj, {
    name: 'Checking',
    __cacheId: 1
  }, 'Object has the expected params.');
});

QUnit.test('Pass object with id and __remoteId', function(assert) {
  var account = {
    id: 1,
    __remoteId: 44,
    name: 'Checking'
  };
  var options = Object.assign({}, defaults, {
    remoteIdProp: '_id',
    cacheIdProp: 'id'
  });
  var obj = cacheOut(account, options);
  assert.deepEqual(obj, {
    name: 'Checking',
    _id: 44,
    __cacheId: 1
  }, 'Object has the expected params.');
});
