var gulp = require('gulp');
var npdcGulp = require('npdc-gulp');
var config = npdcGulp.baseConfig;
var package = require('./package.json');
config.COMMON_VERSION = package.dependencies['npdc-common'].split("npdc-common#v")[1];
npdcGulp.loadAppTasks(gulp, config);
