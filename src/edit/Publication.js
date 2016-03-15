'use strict';

function Publication(PublicationResource, NpolarApiSecurity) {
  'ngInject';
  
  const schema = 'http://api.npolar.no/schema/publication-1';
  
  return Object.assign(PublicationResource, {
    
    schema,
    
    create: function() {

      let user = NpolarApiSecurity.getUser();
      let id = user.email;
      let email = user.email;
      let [first_name,last_name] = user.name.split(' ');
      let organisation = user.email.split('@')[1];
      
      user = { id, roles: ['author'], first_name, last_name, email, organisation};
      let collection = 'publication';
      let publication_type = 'other';
      let topics = ['other'];
      let title = `Publication created by ${user.email} ${new Date().toISOString()}`;
      let people = [user];
      let locations = [{ country: 'NO'}];
      
    
      //let id = PublicationResource.randomUUID();
      let p = { title, collection, schema, people, publication_type, topics, locations,
        state:'published', draft:'no'
      };
      console.debug(p);
      return p;
      
    },
    
    hashiObject: function(file) {
      return {
        url: file.uri,
        filename: file.filename,
        // icon
        file_size: file.length,
        md5sum: (file.hash||'md5:').split('md5:')[1],
        content_type: file.type
      };
    },
  
    fileObject: function(hashi) {
      return {
        uri: hashi.url,
        filename: hashi.filename,
        length: hashi.file_size,
        hash: 'md5:'+hashi.md5sum,
        type: hashi.content_type
      };
    }
      
  });
  
}
module.exports = Publication;