'use strict';
var PublicationSearchController = function (
  $scope, $location, $controller, $filter,
  Publication, npdcAppConfig, NpdcSearchService
) {
  'ngInject';

  function query() {
    let defaults = {
      limit: $location.search().limit || 50,
      fields: 'title,id,updated,publication_type,published,journal,people,organisations',
      facets: 'publication_type,state,topics,journal.name,people.email,license',
      score: true
    };

    if (!$location.search().sort) {
      if ($location.search().q) {
        defaults.sort = "-published,-updated,publication_type";
      } else {
        defaults.sort = "-updated,-published,publication_type";
      }
    }

    let invariants = $scope.security.isAuthenticated() ? {} : { "not-draft": "yes" } ;
    return Object.assign({}, defaults, invariants);
  }

  function init() {
    $controller('NpolarBaseController', {
      $scope: $scope
    });

    $scope.resource = Publication;
    $scope.$on('$locationChangeSuccess', (event, data) => {
      $scope.search(query());
    });

    npdcAppConfig.search.local.results.subtitle = "publication_type";
    npdcAppConfig.search.local.filterUi = {
      'year-published': {
        type: 'range'
      }
    };

    npdcAppConfig.search.local.results.detail = (e) => {
      let publishedYear = e.published ? e.published.split('-')[0] : '?';
      let journal = '';
      if (e.journal && e.journal.name) {
        journal =  e.journal.name ;
      }
      //let updated = e.updated.split('T')[0];

      let author = '';
      if (e.people && e.people.length) {
        let authors = e.people.filter(p => (p.roles||[]).includes('author'));
        if (authors && authors.length > 0) {
          author = authors[0].last_name||'?';
          if (authors.length === 2) {
            author += ' & '+ authors[1].last_name;
          }
          if (authors.length > 2) {
            author += ' et al.';
          }
        } else {
          let editors = e.people.filter(p => (p.roles||[]).includes('editor'));
          if (editors && editors.length > 0) {
            author = editors[0].last_name||'?';
            if (editors.length === 2) {
              author += ' & '+ editors[1].last_name;
            }
            if (editors.length > 2) {
              author += ' et al.';
            }
            author +=' (ed.)';
          }
        }

      }
      let publisherName = journal;
      if (publisherName === '') {
        publisherName = (e.organisations||[]).filter(o => (o.roles||[]).includes('publisher')).map(o => o.name).join(' / ');
      }

      return `${author} (${publishedYear})${ publisherName !== '' ? `. ${publisherName}` : ''}`;
    };

  }


  init();
  $scope.search(query());

};

module.exports = PublicationSearchController;
