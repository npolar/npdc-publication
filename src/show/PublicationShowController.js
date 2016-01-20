'use strict';
/**
 * @ngInject
 */
var PublicationShowController = function ($anchorScroll, $controller, $location, $routeParams,
  $scope, $sce, $q, $http, Dataset, Project, Publication, npdcAppConfig) {

  $controller('NpolarBaseController', {$scope: $scope});
  $scope.resource = Publication;
  $scope.error = null;

  $scope.isNpolar = (author) => {
    return (author && author.email && (/npolar/).test(author.email));
  };

  let isValidDOI = (doi) => {
    let doiRegex = /^(http\:\/\/dx\.doi\.org\/|doi:)?10\.[0-9]+\//;
    return doiRegex.test(doi);
  };

  // Extract valid DOI link, from link[rel=doi].(href|title)
  let extractDOILink = (links) => {
    let href;
    let link = links.find(link => { return /doi/i.test(link.rel);} );

    if (link && link.href) {
      if (isValidDOI(link.href)) {
        href = link.href;
      } else if (isValidDOI(link.title)) {
        href = link.title;
      }
      if (isValidDOI(href)) {
        let title = href.replace('http://dx.doi.org/', '');
        return { href, title };
      } else {
        console.warn("Invalid DOI", href);
        //@todo Flag invalid DOI for isAuthorized('update', resource.path);
      }
    }
    return null;
  };

  let citation = function (publication) {
    let authors = publication.people.reduce((memo, p) => {
      memo += memo ? ', ' : '';
      return memo + p.last_name + ', ' + p.first_name.substr(0, 1) + '.';
    }, '');
    let year = publication.published_sort.split('-')[0];
    let journal = publication.journal ? publication.journal.name : '';
    let vol = publication.volume ? publication.volume : '';
    let pages = publication.pages ? publication.pages[0] + '-' + publication.pages[1] +'.' : '';
    return `${authors} (${year}). ${publication.title}.
      ${journal} ${vol} ${pages}`;
  };

  let show = function() {
    $scope.show().$promise.then(publication => {
      npdcAppConfig.cardTitle = publication.title;
      $scope.uri = publication.id;
      if (publication.people) {
        $scope.authors = publication.people.filter(p => (p.roles.includes('author') || p.roles.includes('co-author')) );
        $scope.citation = citation(publication);
      }

      if (publication.links instanceof Array) {
        $scope.links = publication.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit" && l.rel !== "data"));
        $scope.doi = extractDOILink(publication.links);
        $scope.alternate = publication.links.filter(l => ( ( l.rel === "alternate" && l.type !== "text/html") || l.rel === "edit" ));
      }

      let relatedQuery = { q: publication.title, fields: 'id,title,collection', score: true, limit: 5 };

      let relatedPublications = Publication.array(Object.assign({}, relatedQuery, {'not-id': publication.id })).$promise;

      let relatedDatasets = Dataset.array(relatedQuery).$promise;

      let relatedProjects = Project.array(relatedQuery).$promise;

      $q.all([relatedDatasets, relatedPublications, relatedProjects]).then((related) => {
        $scope.related = related;
      });

    }, (errorData) => {
      $scope._error = errorData.statusText;
    });

  };

  show();

};

module.exports = PublicationShowController;
