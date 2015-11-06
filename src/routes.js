'use strict';

/**
 * @ngInject
 */
var router = function($routeProvider, $locationProvider) {

  $locationProvider.html5Mode(true).hashPrefix('!');

  $routeProvider.when('/:id', {
    templateUrl: 'show/show-publication.html',
    controller: 'PublicationShowController'
  }).when('/:id/edit', {
    template: '<npdc:formula></npdc:formula>',
    controller: 'PublicationEditController'
  }).when('/', {
    template: '<npdc-search:input feed="feed"></npdc-search:input><npdc:search feed="feed"></npdc:search>',
    controller: 'PublicationSearchController',
    reloadOnSearch: false
  });
};

module.exports = router;
