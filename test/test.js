/* global describe, it, window, require */
(function () {
  var assert = window.assert;

  describe('can.Feathers.Model', function () {
    it('initializes can.Feathers', function () {
      assert.ok(can.Feathers, 'can.Feathers exists');
    });

    it('connects via SocketIO', function (done) {
      can.Feathers.connect().then(function (socket) {
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
      var Todo = can.Feathers.model('/todos/');

      Todo.bind('created', function (ev, todo) {
        assert.equal(todo.attr('description'), 'Some test');
        done();
      });

      can.ajax({
        url: '/todos',
        data: { description: 'Some test' },
        method: 'POST'
      });
    });

    it('updating model via REST updates live binding', function (done) {
      var Todo = can.Feathers.model('/todos/');
      var ta = $('#testarea');

      Todo.bind('updated', function () {
        assert.equal(ta.find('p.done').length, 1);
        assert.equal(ta.find('p.done').html(), 'Live-bound',
          'Live bound template updated with REST data');
        ta.empty();
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

    it.skip('removing a model via REST removes entry from live binding', function(done) {

    });
  });
})();
