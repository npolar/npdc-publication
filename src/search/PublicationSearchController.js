'use strict';
/**
 * @ngInject
 */
var PublicationSearchController = function ($scope, $location, $controller, Publication, $mdToast, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Publication;

  let query = function() {
    let defaults = { limit: 50,
    sort: "-published_sort,-updated",
    fields: 'title,id,updated,publication_type,published_sort,journal',
    facets: "publication_type,state,topics,journal.name,people.email", score: true };
    
    let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;
    return Object.assign({}, defaults, invariants);
  };

  $scope.search(query());

  npdcAppConfig.search.local.results.detail = (e) => {
    let journal = e.journal && e.journal.name ? " in " + e.journal.name : "";
    return "Published: " + (e.published_sort ? e.published_sort.split('T')[0] : '') + journal;
   };

  npdcAppConfig.cardTitle = "Publications";
  npdcAppConfig.search.local.results.subtitle = "publication_type";
  /*npdcAppConfig.search.local.filterUi = {
    'year-published_sort': {
      type: 'range'
    },
    'updated': {
      type: 'hidden'
    }
  };*/

  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });

};

module.exports = PublicationSearchController;
