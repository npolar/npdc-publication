'use strict';

/**
 * @ngInject
 */
var PublicationEditController = function ($scope, $controller, $routeParams, Publication) {

  // EditController -> NpolarEditController
  $controller('NpolarEditController', { $scope: $scope });

  // Publication -> npolarApiResource -> ngResource
  $scope.resource = Publication;

  // Formula ($scope.formula is set by parent)
  $scope.formula.schema = '//api.npolar.no/schema/publication';
  $scope.formula.form = 'edit/formula.json';
  $scope.formula.language = 'edit/translation.json';
  $scope.formula.templates = [
    {
      match(field) {
        if (field.id === "links_object") {
          return field.fields.some(subField =>
            subField.id === "rel" && ["alternate", "edit", "via"].includes(subField.value)
          );
        }
      },
      hidden: true
    },
    {
      match(field) {
        return field.id === "people_object";
      },
      template: '<npdc:formula-person></npdc:formula-person>'
    },
    {
      match(field) {
        return field.id === "gcmd";
      },
      template: '<npdc:formula-gcmd></npdc:formula-gcmd>'
    },
    {
      match(field) {
        return field.id === "locations_object";
      },
      template: '<npdc:formula-placename></npdc:formula-placename>'
    }
  ];

  console.log('facets', Publication.facets());

  // edit (or new) action
  $scope.edit();

};

module.exports = PublicationEditController;
