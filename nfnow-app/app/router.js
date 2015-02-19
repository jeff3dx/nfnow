import Ember from 'ember';

var Router = Ember.Router.extend({
  location: NetflixNowENV.locationType
});

Router.map(function() {
  this.route('main');
  this.route('main', {path: '/'});
  this.route('main', {path: '/now'});
});

export default Router;
