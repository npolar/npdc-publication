'use strict';

let xml2js = require('xml2js');

module.exports = function SherpaRomeo($http, npolarApiConfig) {
  'ngInject';

  //let self = this;

  const base = '//www.sherpa.ac.uk/romeo/api29.php';

  const key = npolarApiConfig.romeo.key;

  const get = (params) => {
    return new Promise((resolve, reject) => {
      $http.get(base, {
        params,
        headers: {'Accept': 'application/xml'}
      }).then(r => {
        let xml = r.data;
        xml2js.parseString(xml, (err,romeo) => {
          if (!err) {
            resolve(romeo);
          } else {
            reject(err);
          }
        });
      }, (r) => {
        reject(r);
      });
    });
  };

  return {

    base,

    key,

    // Jornal title search
    jtitle: (jtitle, qtype='contains') => {
      let params = { ak: key, jtitle, qtype};
      return get(params);
    }
  };
};