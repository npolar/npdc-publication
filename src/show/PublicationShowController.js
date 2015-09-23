'use strict';
/**
 * @ngInject
 */
var PublicationShowController = function ($anchorScroll, $controller, $location, $log, $routeParams, $scope, Dataset, Project, Publication) {
  
  $controller('NpolarBaseController', {$scope: $scope});
  
  $scope.resource = Publication;
  
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
    
    if (link && link.href instanceof String) {
      if (isValidDOI(link.href)) {
        href = link.href;
      } else if (isValidDOI(link.title)) {
        href = link.title;
      }
      if (isValidDOI(href)) {
        let title = href.replace('http://dx.doi.org/', '');
        return { href, title };
      } else {
        $log.warn("Invalid DOI", href);
        //@todo Flag invalid DOI for isAuthorized('update', resource.path);
      }
    }  
  };
    
  let show = function() {
    Publication.fetch($routeParams, (publication) => {
    
      $scope.document = publication;
      
      $scope.uri = publication.id;
      
      $scope.authors = publication.people.filter(p => (p.roles.includes('author') || p.roles.includes('co-author')) );
      
      if (publication.links instanceof Array) {
        $scope.links = publication.links.filter(l => (l.rel !== "alternate" && l.rel !== "edit" && l.rel !== "data"));
        
        $scope.doi = extractDOILink(publication.links);
        
        
        $scope.alternate = publication.links.filter(l => ( ( l.rel === "alternate" && l.type !== "text/html") || l.rel === "edit" ));
      }
      
      let relatedQuery = { q: publication.title, fields: 'id,title', score: true, limit: 5 };
      $scope.related = {};           
      
      Publication.array(Object.assign(relatedQuery, {'not-id': publication.id }), related => {
        $scope.related.publications = related.filter(r => r._score > 0.4);
      });
      
      Dataset.array(relatedQuery, related => {
        $scope.related.datasets = related.filter(r => r._score > 0.2);
      });
      
      Project.array(relatedQuery, related => {
        $scope.related.projects = related.filter(r => r._score > 0.2);
      });
      
      $log.debug("publication", publication);      
      
    });

  };  
  
  show();
  
};

module.exports = PublicationShowController;