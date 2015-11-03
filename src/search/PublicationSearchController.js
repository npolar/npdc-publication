'use strict';
/**
 * @ngInject
 */
var PublicationSearchController = function ($scope, $location, $controller, Publication, $mdToast, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Publication;

  let defaults = { limit: 50, sort: "-published_sort,-updated", fields: 'title,id,updated,publication_type', facets: "publication_type,state,topics", score: true };
  let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;
  let query = Object.assign(defaults, $location.search(), invariants);

  $scope.search(query);

  npdcAppConfig.cardTitle = 'Publications';
  npdcAppConfig.search.results = {
    subtitle: 'publication_type'
  };

};

module.exports = PublicationSearchController;
