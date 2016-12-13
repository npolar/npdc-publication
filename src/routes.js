'use strict';

/**
 * @ngInject
 */
var router = function($routeProvider, $locationProvider) {

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/:id', {
    templateUrl: 'show/show-publication.html',
    controller: 'PublicationShowController'
  }).when('/10^', {
    templateUrl: 'show/show-publication.html',
    controller: 'PublicationShowController'
  }).when('/:id/edit', {
    templateUrl: 'edit/edit-publication.html',
    controller: 'PublicationEditController'
  }).when('/', {
    template: require('./search/search-publication.html'),
    controller: 'PublicationSearchController',
    reloadOnSearch: false
  });
};

module.exports = router;
