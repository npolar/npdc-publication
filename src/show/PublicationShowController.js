'use strict';

function PublicationShowController($anchorScroll, $controller, $location, $routeParams, $scope, $sce, $q, $http, $mdDialog,
  NpolarLang, NpolarApiSecurity, npdcAppConfig, NpdcCitationModel, SherpaRomeo,
  Dataset, Project, Publication) {

  'ngInject';

  //let self = this;

  $controller('NpolarBaseController', {$scope: $scope});
  $scope.resource = Publication;
  $scope.error = null;
  $scope.lang = NpolarLang;

  $scope.isOpen = (publication) => {
    return Publication.isOpen(publication);
  };

  $scope.license = 'cc-by';

  $scope.attachmentUri = (file) => {
    let uri = file.uri;
    function key() {
      let system = NpolarApiSecurity.getSystem('read', $scope.resource.path);
      let key;
      if (system.key) {
        key=system.key;
      }
      return key;
    }
    // Show key when logged in
    //if (false === (/^http/).test($scope.document.license)) {
    //  uri += '?key='+key();
    //}
    if (key()) {
      uri += '?key='+key();
    }
    return uri;
  };


  $scope.isNpolar = (author) => {
    if (author.organisation) {
      return (/Norwegian Polar Institute$/).test(author.organisation);
    } else if (author && author.email) {
      return (/@npolar\.no$/).test(author.email);
    }
    return false;

  };

  $scope.names = (people) => {
    return people.map(p => p.first_name +' '+ p.last_name);
  };

  let show = function() {
    $scope.show().$promise.then(publication => {

      $scope.uri = Publication.uri(publication);

      $scope.citations = Publication.citationList(publication);

      $scope.metadata = Publication.metadata(publication, $scope.resource);

      $scope.citation = $scope.citations[0];

      if (publication.journal && publication.journal.name) {
        SherpaRomeo.jtitle(publication.journal.name).then(romeo => {
          $scope.romeo = { publisher: romeo.romeoapi.publishers[0].publisher };
        });
      }

      if (publication.people instanceof Array) {
        $scope.authors = publication.people.filter(p => ( (p.roles||[]).includes('author')) );
        $scope.coauthors = publication.people.filter(p => ( (p.roles||[]).includes('co-author')) );
        $scope.editors = publication.people.filter(p => ( (p.roles||[]).includes('editor')) );
      }

      if (publication.organisations instanceof Array) {
        $scope.publishers = publication.organisations.filter(o => ( (o.roles||[]).includes('publisher')) );
      }

      if (publication.links instanceof Array) {
        $scope.links = publication.links.filter(l => {
          return (l.rel !== "alternate" && l.rel !== "parent" && l.rel !== "edit" && l.rel !== "attachment" &&
            l.rel.toLowerCase() !== "doi" &&
            false === (/doi[.]org/).test(l.href) );
        });

        if ($scope.isOpen(publication) || $scope.security.hasSystem($scope.resource.path)) {
          $scope.links = $scope.links.concat(publication.links.filter(l => l.rel === "attachment"));
        }

        //$scope.doi = extractDOILink(publication.links);
        $scope.alternate = publication.links.filter(l => ( ( l.rel === "alternate" && l.type !== "text/html") || l.rel === "edit" ));

        if (publication.publication_type === 'in-report' && publication.journal && publication.journal.name) {
          $scope.parent = {
            title: publication.journal.name
          };
        }

        let parent = publication.links.find(l => l.rel === "parent");
        if (parent) {

          let uri = parent.href.replace(/\/\/data\./, '//api.');
          $http.get(uri).then(r =>  {
            $scope.parent = r.data;
          }, (e) => {
            $scope.parent = { title: parent.title, href: parent.href };
          });
        }
      }


      Publication.array({ q: '', fields: 'id,title', limit: 'all',
        'filter-links.rel': 'parent',
        'filter-links.href': `https://data.npolar.no/publication/${publication.id}`
      }).$promise.then(children => {
        let child_links = children.sort((a,b) => { return (a.title > b.title); }).map(c => {
          return { rel: "child", title: c.title, href: `https://data.npolar.no/publication/${c.id}`};
        });
        if (child_links) {
          $scope.links = ($scope.links||[]).concat(child_links);
        }
      });

      let relatedQuery = { q: publication.title, fields: 'id,title,collection,published,publication_type', score: true, limit: 5 };

      let relatedPublications = Publication.array(Object.assign({}, relatedQuery, {'not-id': publication.id })).$promise.then(arr => {
        return arr.map(p => {
          p.title += ` [${p.publication_type}] (${p.published.split('-')[0] })`;
          return p;
        });
      });

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
}

module.exports = PublicationShowController;