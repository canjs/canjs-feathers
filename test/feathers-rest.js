import feathers from 'feathers/client';
import hooks from 'feathers-hooks';
import rest from 'feathers-rest/client';
import jQuery from 'jquery';
import auth from 'feathers-authentication/client';
import decode from 'jwt-decode';
import rxjs from 'rxjs';
import rx from 'feathers-reactive';

const host = '';
const app = feathers()
  .configure(rx(rxjs))
  .configure(hooks())
  .configure(rest(host).jquery(jQuery))
  // .configure(rest(host).jquery(jQuery))
  .configure(auth({
    storage: window.localStorage
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
