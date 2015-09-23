'use strict';
/**
 * @ngInject
 */
var PublicationSearchController = function ($scope, $location, $controller, Publication, $mdToast) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Publication;
  
  let defaults = { limit: 50, sort: "-published_sort", fields: 'title,id', facets: "topics,publication_type,state,draft", score: true };
  let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;  
  let query = Object.assign(defaults, $location.search(), invariants);
  
  $scope.search(query);

};

module.exports = PublicationSearchController;