'use strict';

// @todo search for data(!)
// @todo check/remove unused deps (jshint setting)
// @todo bottomSheetOptions => find NPOLAR people? lookup DOI?


function PublicationEditController($scope, $controller, $http, $location,
  formula, formulaAutoCompleteService, fileFunnelService, npolarCountryService,
  npolarApiConfig, NpolarMessage, NpolarApiSecurity, NpolarLang,
  npdcAppConfig, NpdcDOI, CrossrefWorks, SherpaRomeo, Publication, Person) {
  'ngInject';

  const unique = (arr) => [... new Set(arr)];

  const uniq = (arr, p='name') => {
    return arr.filter((thing, index, self) => self.findIndex(t => t[p] === thing[p]) === index);
  };

  //const schema = '//api.npolar.no/schema/publication-1';
  const schema = 'edit/publication-1.json';

  function init() {

    $controller('NpolarEditController', { $scope: $scope });
    $scope.resource = Publication;
    $scope.duplicates = false;

    let templates = [{
        match: "people_item",
        template: '<npdc:formula-person></npdc:formula-person>'
      }];

    /*let i18n = [{
        map: require('./en.json'),
        code: 'en'
      },
      {
        map: require('./no.json'),
        code: 'nb_NO',
      }];*/

    $scope.formula = formula.getInstance({
      schema,
      form: 'edit/formula.json',
      language: NpolarLang.getLang(),
      templates: npdcAppConfig.formula.templates.concat(templates)//,
      //languages: npdcAppConfig.formula.languages.concat(i18n)
    });



    formulaAutoCompleteService.autocomplete({
      match: "publication_lang",
      querySource: npolarApiConfig.base + '/language',
      label: 'native',
      value: 'code'
    }, $scope.formula);

    formulaAutoCompleteService.autocomplete({
      match: "#/conference/country",
      querySource: npolarApiConfig.base + '/country',
      label: 'native',
      value: 'code'
    }, $scope.formula);

    formulaAutoCompleteService.autocomplete({
      match: "@language",
      querySource: npolarApiConfig.base + '/language/?filter-code=en|nb|nn|ru|ja|de|pt|fr|zh|es|fi|sv&sort=code&q=',
      label: 'native',
      value: 'code'
    }, $scope.formula);

    // @todo, need to redfine ES mapping...
    // let autocompleteFacets = ["id", "schema", "doi", "title", "publication_lang", "published", "volume", "issue", "suppl", "art_no",
    // "page_count", "comment", "created", "updated", "created_by", "updated_by", "_id", "_rev", "abstract.@language", "abstract.@value",
    //"overview.@language", "overview.@value", "locations.placename", "locations.area", "locations.country", "locations.hemisphere",
    //"journal.id", "journal.name", "journal.np_series", "journal.series", "journal.series_no", "conference.id", "conference.name",
    //"conference.place", "conference.country", "conference.dates", "people.id", "people.first_name", "people.last_name", "people.email", "people.roles", "people.organisation",
    //"organisations.id", "organisations.name", "organisations.location", "organisations.roles", "links.rel", "links.href", "links.hreflang",
    //"links.title", "links.type", "files.uri", "files.filename", "files.title", "files.length", "files.type", "files.hash"]
    let autocompleteFacets = ['tags', 'journal.name', 'links.type',
      'organisations.id', 'organisations.name', 'organisations.location'];
    formulaAutoCompleteService.autocompleteFacets(autocompleteFacets, $scope.resource, $scope.formula);
  }

  function initFileUpload(formula) {

    let server = `${NpolarApiSecurity.canonicalUri($scope.resource.path)}/:id/_file`;
    fileFunnelService.fileUploader({
      match(field) {
        return field.id === "files";
      },
      server,
      multiple: true,
      /*restricted: function () {
        return false;
      },*/
      fileToValueMapper: Publication.fileObject,
      valueToFileMapper: Publication.hashiObject,
      fields: ['uri'] //'type', 'hash',
    }, formula);
  }

  /*function checkForDuplicates(title, id=$scope.formula.getModel().id) {
    let query = {q: title, fields: 'id,title,doi,journal,people,publication_type,published,_score',
      score: true,
      limit:10
    };
    if (id) {
      query['not-id'] = id;
    }

    Publication.array(query).$promise.then(r => {
      //let current = $scope.formula.getModel();
      let duplicates = r.filter(d => d._score > 1.2);
      if (duplicates.length > 0) {
        let m =  `Duplication warning [n=${duplicates.length}]`;
        console.log(m, duplicates);

        console.log(`this:       ${c.id} ${c.published} ${c.publication_type} 1st author: ${(c.people||[]).find(p=> (p.roles||[]).includes('author')).last_name||'?'}`);
        duplicates.forEach((d,i) => {
          console.log(`duplicate?: ${d.id} ${d.published} ${d.publication_type} 1st author: ${(d.people||[]).find(p=> (p.roles||[]).includes('author')).last_name||'?'} [score: ${d._score}]`);
        });
        $scope.duplicates = true;
      }
    });
  }*/

  init();
  initFileUpload($scope.formula);

  // edit (or new) action
  $scope.edit().$promise.then(p => {

    if (p.topics === ['other'] && p.programme.length > 0) {

      p.topics = p.programme.map(prg => Publication.topicFromProgramme(prg));
      console.log('topics',p.topics);
      //$scope.formula.setModel(p);
    }


    if (p.journal && p.journal.name) {
      SherpaRomeo.jtitle(p.journal.name);
      // http://sherpa.ac.uk/romeo/apimanual.php?la=en
    }



  });

  // Watch title and parse BibTeX if pasted
  /*
  $scope.$watch('formula.getModel().title', function(title, was) {

    if (!$scope.duplicates && title && title.length && title.length > 10 && (title.match(/\s/g) || []).length >= 3 && !title.match(/[@\{\}]/)) {
      checkForDuplicates(title);
    }

    if (title && title.length && !$scope.duplicates) {

      if (Publication.isBibTeX(title)) {


        let bibtex = Publication.parseBibTeX(title);
        console.log('bibtex', bibtex);


        if (bibtex.length > 0) {

          NpolarMessage.info(`Importing BibTex reference @${bibtex[0].entryType} {${bibtex[0].citationKey}}`);

          let p = Publication.importBibTeX(bibtex[0], $scope.formula.getModel());
          if (p && p !== undefined) {
            // Update the formula model
            $scope.formula.setModel(p);


          }
        }
      } // end bibtex import
    }
  }); // end watch title
  */


  $scope.findNpolarAuthorsAndUpdateFormulaModel = function(p = $scope.formula.getModel()) {
      // Find and set npolar.no employees
      if ((p.people||[]).length > 0) {

        let qLastName = p.people.map(p => p.last_name).join(',');

        Person.array({q:null, 'q-last_name': qLastName,
          fields: 'first_name,last_name,email,organisation',
          //'filter-currently_employed': true,
          'filter-organisation':'npolar.no', // hmm does not work with filter-people.organisation?
          limit: 'all'}).$promise.then(a => {
          if (a && a.length > 0) {

            let found=0;
            let was = p.people.filter(p => p.organisation === 'npolar.no').length;

            p.people.forEach((cand,i) => {
              let idx = a.findIndex(person => {
                return (
                  (person.last_name === cand.last_name) &&
                  (person.first_name === cand.first_name || person.first_name[0] === cand.first_name[0])
                );
              });
              if (idx >= 0) {
                found += 1;

                if (cand.email) {
                  cand.homepage = 'http://www.npolar.no/en/people/' + cand.email.split('@')[0];
                }

                p.people[i] = Object.assign(cand, a[idx]);
                console.debug('Found', p.people[i], found);
              }
            });

            if (found > 0) {
              if (found > was) {
                NpolarMessage.info(`Found ${found} NPI employee(s)`);
                $scope.formula.setModel(p);
              }

            }
          }
        });
      } // end set npolar.no employees


  };

  // todo move into button and create method for it
  $scope.$watch('formula.getModel().doi', function(doi, was) {

  console.log('doi', doi, 'was', was);
    if (NpdcDOI.isDOI(doi)) {

      let p = $scope.formula.getModel(); // p => publication (currently being edited)

      if (!p.id) {
        p = Object.assign({}, Publication.create(),p);
      }



      // Check for DOI duplicates
      // FIXME @todo Do not split once publication/doi tokenization is removed on indexing
      Publication.array({
        'not-id': p.id,
        'q-doi': doi.split('/')[1],
        fields: 'id,title,doi',
        q: null
        }).$promise.then(arr => {

        if (arr && arr.length > 0) {
          let dup = arr[0];
          if (dup.doi === doi) {
            $scope.duplicates = arr;
            let title = dup.title;
            NpolarMessage.error(`Duplicate DOI ${doi}`);
            $scope.formula.setModel(Object.assign(p, {
              publication_type: 'duplicate',
              title: `DOI:${doi} is already linked in publication id ${dup.id} ["${title}"]`, doi: doi.split('/')[0]
            }));
            return;
          }
        }
      });

      // Get DOI metadata
      CrossrefWorks.get(doi).then(r => {
        if (!r.data.message) {
          return;
        }

        let m = r.data.message; // m => DOI metadata

        if (!p._rev) {
          NpolarMessage.info(`doi:${doi} metadata found`);
        }

        console.log('crossref.org DOI message', m);

        let npolarPublication = CrossrefWorks.npolarPublication(m);

        console.log('npolarPublication from crossref.org DOI message', npolarPublication);

        if (!p.title) {

          // Keep existing organisations and tags
          let organisations = p.organisations||[];
          let tags = p.tags||[];
          let people = npolarPublication.people;

          p = Object.assign({}, p, npolarPublication);
          p.organisations = uniq(organisations.concat(npolarPublication.organisations), 'name');
          p.tags = unique(tags.concat(p.tags||[]));
          p.topics = unique(p.topics||[]);
          p.locations = unique(p.locations||[]);
          p.issn = unique(p.issn);
          p.pages = unique(p.pages);
          p.links = unique(p.links||[]);
          // @todo remeove links to doi.org?
          p.title = p.title.trim();
          //if (people.length > 1 && people.length === p.people.length) {
          //  // Update people if more than 1
          //  p.people = people;
          //}
          p.people = people;
          delete p.$resolved;

          console.log('p -> setModel', p);
          $scope.formula.setModel(p);

          if (!p.people.find(person => person.organisation === 'npolar.no')) {
            $scope.findNpolarAuthorsAndUpdateFormulaModel(p);
          }


        } else {
          if (JSON.stringify(p.title) !== JSON.stringify(npolarPublication.title.trim())) {
            NpolarMessage.error(`Title does not match registered DOI title`);
          }
          console.debug('Metadata not updated from DOI/Crossref.org');
        }
        /**
         *
         *=> impprtInto
         let authors = p.people.filter(p => p.roles.includes('author'));
        if (m.author) {
          let author = { roles: ['author']};

          if (m.author.length === authors.length) {
            // Check first author
            if (m.author[0].family !== authors[0].last_name) {
              NpolarMessage.error(`First author mismatch: "${authors[0].last_name}" vs. "${authors[0].last_name}" in DOI`);
            }
            // Update given names (if more characters in DOI metadata ie. first name and not just initials)
          } else {
            NpolarMessage.error(`Author count (${ authors.length }) different from count in DOI (${ m.author.length })`);
          }
        }

        if (m.publisher) {
          let publisher = { name: m.publisher, roles: ['publisher']};
          let publisherIdx = p.organisations.findIndex(o => o.roles.includes('publisher'));

          if (publisherIdx >= 0) {
            p.organisations[publisherIdx] = Object.assign(p.organisations[publisherIdx], publisher);
          } else {
            p.organisations.push(publisher);
          }
        }

        if (m.funder) {
          p.organisations = p.organisations.concat(m.funder.map(f => {
            return { name: f.name, roles: ['funder'] };
          }));
        }
        p.organisations = unique(p.organisations);
       */





        }, (error) => {
          if (error.status === 404) {
            NpolarMessage.error(`DOI metadata missing for ${doi}`);
          } else {
            console.error(`DOI API error ${error.status} ${error.statusText} for ${doi}`);
            //NpolarMessage.error(`DOI API error ${error.status} ${error.statusText} for ${doiApiUri}`);
          }

        });
      }
    });


}
module.exports = PublicationEditController;