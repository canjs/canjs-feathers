/* global describe, it, window, require */
(function () {
  var assert = window.assert;
  var socket = io('', {transports: ['websocket']});

  describe('can.Feathers.Model', function () {
    var Todo;

    before(function(done) {
      can.Feathers.connect(socket).then(function() {
        Todo = can.Feathers.model('/todos/');
        done();
      });
    });

    it('initializes can.Feathers', function () {
      assert.ok(can.Feathers, 'can.Feathers exists');
    });

    it('connects via SocketIO', function (done) {
      can.Feathers.connect(socket).then(function (socket) {
        assert.equal(typeof socket.on, 'function', 'Got a socket');
        done();
      });
    });

    it('Todo CRUD', function (done) {
      var Todo = can.Feathers.model('/todos/');
      var laundry = new Todo({ description: 'Do some laundry!' });
      var expectedLatest = {
        id: 0,
        description: 'Really do laundry!',
        done: false
      };

      // First we need to clear all our test todos
      can.ajax({
        url: '/todos/clear',
        dataType: 'json'
      }).then(function () {
        // ::create
        laundry.save().then(function (todo) {
          assert.deepEqual(todo.attr(), {
            id: 0,
            description: 'Do some laundry!',
            done: false
          });

          todo.attr('description', 'Really do laundry!');

          // ::update
          return todo.save();
        })
        .then(function (todo) {
          // ::find
          return Todo.findAll();
        })
        .then(function (todos) {
          assert.equal(todos.length, 1, 'Got one todo');
          assert.deepEqual(todos[0].attr(), expectedLatest,
            'findAll returned with updated Todo');
          // ::get
          return Todo.findOne({ id: todos[0].id });
        })
        .then(function (todo) {
          assert.deepEqual(todo.attr(), expectedLatest, 'findOne returned');
          // ::remove
          return todo.destroy();
        })
        .then(function () {
          return Todo.findAll();
        })
        .then(function (todos) {
          assert.equal(todos.length, 0, 'Deleted todo');
          done();
        });
      });
    });

    it('passes service errors', function (done) {
      var Todo = can.Feathers.model('todos');

      Todo.findOne({ id: 23 }).fail(function (error) {
        assert.equal(error.message, 'Todo not found');
        done();
      });
    });

    it('creating model via REST send created event', function (done) {
      Todo.bind('created', function (ev, todo) {
        assert.equal(todo.attr('description'), 'Some test');
        Todo.unbind('created');
        done();
      });

      can.ajax({
        url: '/todos',
        data: { description: 'Some test' },
        method: 'POST'
      });
    });

    it('updating model via REST updates DOM', function (done) {
      var Todo = can.Feathers.model('/todos/');
      var ta = $('#testarea');

      Todo.bind('updated', function () {
        assert.equal(ta.find('p.done').length, 1);
        assert.equal(ta.find('p.done').html(), 'Live-bound',
          'Live bound template updated with REST data');
        ta.empty();
        Todo.unbind('updated');
        done();
      });

      new Todo({
        description: 'update test'
      }).save().then(function (todo) {
        var renderer = can.view.mustache('<p class="{{#if done}}done{{/if}}">' +
          '{{description}}</p>');
        ta.append(renderer(todo));

        can.ajax({
          url: '/todos/' + todo.id,
          data: { description: 'Live-bound', done: true },
          method: 'PUT'
        });
      });
    });

    it('removing a model via REST removes entry from DOM', function(done) {
      var Todo = can.Feathers.model('/todos/');
      var ta = $('#testarea');

      Todo.bind('destroyed', function () {
        assert.equal(ta.find('div').html(), '', 'Div is now empty');
        ta.empty();
        Todo.unbind('destroyed');
        done();
      });

      new Todo({
        description: 'remove test'
      }).save().then(function (todo) {
        var renderer = can.view.mustache('<div>{{#each list}}' +
          '<p class="{{^if done}}todo{{/if}}">{{description}}</p>' +
          '{{/each}}</div>');
        ta.append(renderer({ list: new Todo.List([todo]) }));
        assert.equal(ta.find('p.todo').length, 1, 'One todo rendered in list');

        can.ajax({
          url: '/todos/' + todo.id,
          method: 'DELETE'
        });
      });
    });
  });
})();
