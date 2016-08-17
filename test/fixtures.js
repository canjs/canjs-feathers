import fixture from 'can-fixture';

var fixtureData = [{
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

export default fixtureData;

fixture({url: "/v1/accounts", method: "get"}, function(request, response){
  request.data = Object.assign({}, request.data);

  let newData = fixtureData.map(account => {
    let newObj = Object.assign({}, account);
    return newObj;
  });
  response(newData);
});

fixture({url: "/v1/accounts/{id}", method: "get"}, function(request, response){
  response(Object.assign({}, fixtureData[0]));
});

fixture({url: "/v1/accounts/{id}", method: "put"}, function(request, response){
  response(Object.assign({}, request.data));
});

fixture({url: "/v1/accounts/{id}", method: "patch"}, function(request, response){
  var temp = Object.assign({}, request.data);
  var id = temp.id;
  delete temp.id;
  response(Object.assign(fixtureData[id - 1], temp));
});

fixture({url: "/v1/accounts", method: "post"}, function(request, response){
  var data = Object.assign({}, request.data);
  data._id = 1;
  response(data);
});

fixture({url: "/v1/accounts/{id}", method: "delete"}, function(request, response){
  response(Object.assign({}, fixtureData[0]));
});

fixture({url: "/people/BobMinion", method: "put"}, function(request, response){
  request.data.idInReponse = request.url.replace('/people/', '');
  response(Object.assign({}, request.data));
});

// Test that query params come in properly for `find` requests.
fixture({url: "/v1/robots", method: "get"}, function(request, response){
  var robots = [{
    id: 4,
    model: 'T1000'
  }];
  response(request.data.model ? robots : {error: 'no query object.'});
});
