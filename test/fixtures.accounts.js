import fixture from 'can-fixture';

var accountFixtureData = [{
  _id: 1,
  name: 'Checking',
  balance: 1000.55
}, {
  _id: 2,
  name: 'Savings',
  balance: 40.33
}, {
  _id: 3,
  name: 'Kids Savings',
  balance: 95000.01
}];

export default accountFixtureData;

fixture({url: "/v1/accounts", method: "get"}, function(request, response){
  response(accountFixtureData);
});

fixture({url: "/v1/accounts/{id}", method: "get"}, function(request, response){
  response(accountFixtureData[0]);
});

fixture({url: "/v1/accounts/{id}", method: "put"}, function(request, response){
  response(request.data);
});

fixture({url: "/v1/accounts/{id}", method: "patch"}, function(request, response){
  var id = request.data.id;
  var temp = Object.assign({}, request.data);
  delete temp.id;
  response(Object.assign(accountFixtureData[id - 1], request.data));
});

fixture({url: "/v1/accounts", method: "post"}, function(request, response){
  request.data._id = 1;
  response(request.data);
});

fixture({url: "/v1/accounts/{id}", method: "delete"}, function(request, response){
  response(accountFixtureData[0]);
});
