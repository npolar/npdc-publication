'use strict';

function PublicationEditController($scope, $controller, formula, formulaAutoCompleteService,
  fileFunnelService, NpolarMessage, NpolarApiSecurity, npdcAppConfig, Publication, NpolarLang,
  npolarApiConfig, npolarCountryService) {
  'ngInject';

  $controller('NpolarEditController', { $scope: $scope });
  $scope.resource = Publication;

  let templates = [{
      match: "people_item",
      template: '<npdc:formula-person></npdc:formula-person>'
    }, {
      match: "placenames_item",
      template: '<npdc:formula-placename></npdc:formula-placename>'
    }
  ];
  
  let i18n = [{
      map: require('./en.json'),
      code: 'en'
    },
    {
      map: require('./no.json'),
      code: 'nb_NO',
    }];

  $scope.formula = formula.getInstance({
    schema: '//api.npolar.no/schema/publication-1',
    form: 'edit/formula.json',
    language: NpolarLang.getLang(),
    templates: npdcAppConfig.formula.templates.concat(templates),
    languages: npdcAppConfig.formula.languages
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
    querySource: npolarApiConfig.base + '/language',
    label: 'native',
    value: 'code'
  }, $scope.formula);
  

  // @todo, need to redfine ES mapping...
  // let autocompleteFacets = ["id", "schema", "doi", "title", "publication_lang", "published", "volume", "issue", "suppl", "art_no", "page_count", "comment", "created", "updated", "created_by", "updated_by", "_id", "_rev", "abstract.@language", "abstract.@value", "overview.@language", "overview.@value", "locations.placename", "locations.area", "locations.country", "locations.hemisphere", "journal.id", "journal.name", "journal.np_series", "journal.series", "journal.series_no", "conference.id", "conference.name", "conference.place", "conference.country", "conference.dates", "people.id", "people.first_name", "people.last_name", "people.email", "people.roles", "people.organisation", "organisations.id", "organisations.name", "organisations.location", "organisations.roles", "links.rel", "links.href", "links.hreflang", "links.title", "links.type", "files.uri", "files.filename", "files.title", "files.length", "files.type", "files.hash"]
  // formulaAutoCompleteService.autocompleteFacets(autocompleteFacets, $scope.resource, $scope.formula);

  function initFileUpload(formula) {

    let server = `${NpolarApiSecurity.canonicalUri($scope.resource.path)}/:id/_file`;
    fileFunnelService.fileUploader({
      match(field) {
        return field.id === "files";
      },
      server,
      multiple: true,
      progress: false,
      restricted: function () {
        return !formula.getModel().license;
      },
      fileToValueMapper: Publication.fileObject,
      valueToFileMapper: Publication.hashiObject,
      fields: [] // 'type', 'hash'
    }, formula);
  }


  try {
    initFileUpload($scope.formula);
    // edit (or new) action
    $scope.edit();
  } catch (e) {
    NpolarMessage.error(e);
  }
}

module.exports = PublicationEditController;
