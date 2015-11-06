'use strict';
/**
 * @ngInject
 */
var PublicationSearchController = function ($scope, $location, $controller, Publication, $mdToast, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Publication;

  let query = function() {
    let defaults = { limit: 50, sort: "-published_sort,-updated", fields: 'title,id,updated,publication_type,published_sort', facets: "publication_type,state,topics", score: true };
    let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;
    return Object.assign({}, defaults, $location.search(), invariants);
  };

  $scope.search(query());

  npdcAppConfig.search.local.results.detail = (e) => {
    return "Published: " + e.published_sort.split('T')[0];
   };

  npdcAppConfig.cardTitle = "Publications";
  npdcAppConfig.search.local.results.subtitle = "publication_type";
  npdcAppConfig.search.local.filterUi = {
    'year-published_sort': {
      type: 'range'
    },
    'updated': {
      type: 'hidden'
    }
  };

  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });

};

module.exports = PublicationSearchController;
