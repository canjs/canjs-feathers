// The Todo server demo from
// https://gist.github.com/daffl/6665992/download

var feathers = require('feathers');
var TodoService = require('./todos');

// We need to do this to get proper errors
// see http://stackoverflow.com/questions/18391212/is-it-not-possible-to-stringify-an-error-using-json-stringify
Object.defineProperty(Error.prototype, 'toJSON', {
  value: function () {
    var alt = {};

    Object.getOwnPropertyNames(this).forEach(function (key) {
      alt[key] = this[key];
    }, this);

    return alt;
  },
  configurable: true
});

feathers().configure(feathers.socketio())
  .use(feathers.static(__dirname + '/../../'))
  .get('/todos/clear', function(req, res) {
    req.app.lookup('todos').clear();
    res.json({ cleared: true });
  })
  .use('/todos', new TodoService())
  .listen(8081);
