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
  //$scope.formula.form = 'edit/formula.json';
  $scope.formula.template = 'material';
  
  // edit (or new) action
  $scope.edit();

};

module.exports = PublicationEditController;

