'use strict';

/**
 * @ngInject
 */
var router = function ($routeProvider, $locationProvider) {

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/:id', {
    templateUrl: 'show/show-publication.html',
    controller: 'PublicationShowController'
  }).when('/:id/edit', {
  template: '<npdc:formula></npdc:formula>',
  controller: 'PublicationEditController'
  }).when('/', {
  template: '<npdc:search></npdc:search>',
  controller: 'PublicationSearchController'
  });
};

module.exports = router;
