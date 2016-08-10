import QUnit from 'steal-qunit';
import plugin from './canjs-feathers';

QUnit.module('canjs-feathers');

QUnit.test('Initialized the plugin', function(){
  QUnit.equal(typeof plugin, 'function');
  QUnit.equal(plugin(), 'This is the canjs-feathers plugin');
});
