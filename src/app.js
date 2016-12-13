'use strict';

let npdcCommon = require('npdc-common');
let AutoConfig = npdcCommon.AutoConfig;
let angular = require('angular');

var npdcPublicationApp = angular.module('npdcPublicationApp', ['npdcCommon']);
npdcPublicationApp.factory('PublicationBibTeX', require('./PublicationBibTeX'));
npdcPublicationApp.factory('CrossrefWorks', require('./CrossrefWorks'));
npdcPublicationApp.factory('SherpaRomeo', require('./SherpaRomeo'));

npdcPublicationApp.factory('Publication', require('./edit/Publication'));


npdcPublicationApp.controller('PublicationHomeController', require('./search/PublicationHomeController'));
npdcPublicationApp.controller('PublicationShowController', require('./show/PublicationShowController'));
npdcPublicationApp.controller('PublicationSearchController', require('./search/PublicationSearchController'));
npdcPublicationApp.controller('PublicationEditController', require('./edit/PublicationEditController'));

// Bootstrap ngResource models using NpolarApiResource
var resources = [
  {'path': '/', 'resource': 'NpolarApi'},
  {'path': '/user', 'resource': 'User'},
  {'path': '/person', 'resource': 'Person'},
  {'path': '/dataset', 'resource': 'Dataset' },
  {'path': '/publication', 'resource': 'PublicationResource' },
  {'path': '/project', 'resource': 'Project' }
];

resources.forEach(service => {
  // Expressive DI syntax is needed here
  npdcPublicationApp.factory(service.resource, ['NpolarApiResource', function (NpolarApiResource) {
  return NpolarApiResource.resource(service);
  }]);
});

// Routing
npdcPublicationApp.config(require('./routes')).config(function($mdThemingProvider) {
  $mdThemingProvider.theme('altTheme');
});

npdcPublicationApp.filter('isodate', function() {
  return function(input) {
  if (/[0-9]{4}[-][0-9]{2}[-][0-9]{2}T/.test(input)) {
    return input.split("T")[0];
  } else {
    return input;
  }

  };
});

npdcPublicationApp.filter('published', () => {
  return function(published, fmt) {

    if ('%Y' === fmt && (/^[0-9]{4}-/).test(published)) {
      return published.split('-')[0];
    } else if ('%Y-%m' === fmt && (/^[0-9]{4}-[0-9]{2}-/).test(published)) {
      return published.split('-').slice(0,2).join('-');
    } else if ('%Y-%m-%d' === fmt && (/^[0-9]{4}-[0-9]{2}-[0-9]{2}T/).test(published)) {
      return published.split('T')[0];
    } else {
      return '';
    }

  };
});

// API HTTP interceptor
npdcPublicationApp.config(($httpProvider, npolarApiConfig) => {
  let environment = 'production';
  let autoconfig = new AutoConfig(environment);
  let romeo = { key: '4JiApGee7Js' };
  angular.extend(npolarApiConfig, autoconfig, { romeo }, { resources });
  console.debug('npolarApiConfig', npolarApiConfig);

  $httpProvider.interceptors.push('npolarApiInterceptor');
  //$httpProvider.interceptors.push('xmlHttpInterceptor');
});

// Inject npolarApiConfig and run
npdcPublicationApp.run((npolarApiConfig, npdcAppConfig, NpolarTranslate) => {
  NpolarTranslate.loadBundles('npdc-publication');
});
