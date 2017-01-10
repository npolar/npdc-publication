'use strict';
var PublicationSearchController = function (
  $scope, $location, $controller, $filter,
  Publication, npdcAppConfig, NpdcSearchService
) {
  'ngInject';

  function query() {
    let param = $location.search();
    let query = {
      limit: param.limit || 50,
      fields: 'title,id,updated,publication_type,published,journal,people,organisations',
      facets: param.facets || 'publication_type,programme,topics,journal.name,people.email,organisations.id,organisations.roles,created_by,updated_by',
      sort: param.sort || '-created',
      score: true
    };

    if (!param.sort) {
      if (param.q && param.q !== '') {
        delete query.sort;
      }
    }
    console.log('query', query);
    return query;
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
