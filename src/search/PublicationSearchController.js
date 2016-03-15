'use strict';
/**
 * @ngInject
 */
var PublicationSearchController = function ($scope, $location, $controller, Publication, $mdToast, npdcAppConfig) {

  $controller('NpolarBaseController', { $scope: $scope });
  $scope.resource = Publication;

  let query = function() {
    let defaults = { limit: 50,
    sort: "-published,-updated",
    fields: 'title,id,updated,publication_type,published,journal',
    facets: "publication_type,state,topics,journal.name,people.email,license", score: true };
    
    let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;
    return Object.assign({}, defaults, invariants);
  };

  $scope.search(query());

  npdcAppConfig.search.local.results.detail = (e) => {
    let journal = e.journal && e.journal.name ? " in " + e.journal.name : "";
    return "Published: " + (e.published ? e.published.split('T')[0] : '') + journal;
   };

  npdcAppConfig.search.local.results.subtitle = "publication_type";
  npdcAppConfig.search.local.filterUi = {
    'year-published': {
      type: 'range'
    }
  };

  $scope.$on('$locationChangeSuccess', (event, data) => {
    $scope.search(query());
  });

};

module.exports = PublicationSearchController;
