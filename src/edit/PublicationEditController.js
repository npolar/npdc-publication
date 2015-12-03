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
  $scope.formula = $scope.formula || {};
  $scope.formula.schema = '//api.npolar.no/schema/publication';
  $scope.formula.form = 'edit/formula.json';
  $scope.formula.template = 'material';
  $scope.formula.language = 'edit/translation.json';

  //Tap into save to set predefined values
  var onSaveCallback = $scope.formula.onsave;

  $scope.formula.onsave = function(model) {
    console.log("got here");
    onSaveCallback(model);
  };

  // edit (or new) action
  $scope.edit();

};

module.exports = PublicationEditController;

