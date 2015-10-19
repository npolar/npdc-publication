'use strict';
/**
 * @ngInject
 */
var PublicationSearchController = function ($scope, $location, $controller, Publication, $mdToast) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Publication;
  
  let defaults = { limit: 50, sort: "-published_sort,-updated", fields: 'title,id', facets: "publication_type,state,topics", score: true };
  let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;  
  let query = Object.assign(defaults, $location.search(), invariants);
  
  $scope.search(query);
  
  NpdcAutocompleteConfig.selectedDefault = ['publication'];
  NpdcAutocompleteConfig.placeholder = 'Search publications';
  NpdcAutocompleteConfig.query = defaults;
  

};

module.exports = PublicationSearchController;