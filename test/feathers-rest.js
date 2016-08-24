import feathers from 'feathers/client';
import hooks from 'feathers-hooks';
import rest from 'feathers-rest/client';
import jQuery from 'jquery';
import auth from 'feathers-authentication/client';
import decode from 'jwt-decode';
import rxjs from 'rxjs';
import rx from 'feathers-reactive';
import memory from 'feathers-memory';

const host = '';
const app = feathers()
  .configure(rx(rxjs))
  .configure(hooks())
  .configure(rest(host).jquery(jQuery))
  .configure(auth({
    storage: window.localStorage
  }))
  .use('v1/accounts', new memory({
    idField: '_id',
    startId: 4
  }))
  .use('people', new memory({
    idField: 'id',
    startId: 0
  }))
  .use('v1/robots', new memory({
    idField: '_id',
    startId: 1
  }))
  .use('v1/robots/_cache', new memory({
    idField: 'id',
    startId: 1
  }));

app.getSession = function(){
  let token = app.get('token'),
    session;

  if (token) {
    session = decode(token);
  }
  return session;
};

export default app;
