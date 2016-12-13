'use strict';

function CrossrefWorks($http, NpolarMessage) {
  'ngInject';

  const base = 'api.crossref.org/v1';

  const unique = (arr) => [... new Set(arr)];

  const worksUri = (doi) => {
    return `//${base}/works/${doi}`;
  };

  return {

    base,

    get(doi) {
      return $http.get(worksUri(doi),{
        headers: {'Accept': 'application/json'}
      });
    },

    npolarPublication(m) {

      function publication_type(type) {
        if ('book' === type) {
          return 'book';
        }
        return 'peer-reviewed';
      }

      let title='';

      if (m.title) {
        if (m.title instanceof String) {
          title = m.title;
        } else if (m.title instanceof Array && m.title.length > 0) {
          title = m.title[0];
        }
      }

      let p = { title, people: [], organisations: [], links: [] };

      if (m.author && m.author instanceof Array) {
        p.people = m.author.map(a => {
          let organisation = JSON.stringify(a.affiliation.map(a => a.name)).split(/[\[\]\"]/).join('');
          return { first_name: a.given,
            last_name: a.family,
            roles: ["author"],
            organisation
          };
        });
        // @todo
        // add affs = >orgs
      }

      if (m.editor && m.editor instanceof Array) {
        p.people = m.editor.map(a => {
          let organisation = JSON.stringify(a.affiliation.map(a => a.name)).split(/[\[\]\"]/).join('');
          // @todo
          //let affiliation = a.affiliation.map(a => {
          //  return { '@value': a.name, '@language': 'en'};
          //});
          return { first_name: a.given,
            last_name: a.family,
            roles: ["editor"],
            organisation//,
            //affiliation
          };
        });
        // @todo
        // add affs = >orgs
      }

      if (m['container-title'] && m['container-title'] && m['container-title'].length > 0) {
        let name = m['container-title'].reduce(function (a, b) { return a.length > b.length ? a : b; });
        p.journal = { name };
      }
      console.log(m.URL, m.URL);

      if (m.URL && (/^http(s?):\/\/(.+)/).test(m.URL)) {
        p.links.push({  href: m.URL, rel: "related", hreflang: "en", title});
      }

      p.volume = m.volume;
      if ((/^[0-9]+\-[0-9]+$/).test(m.page)) {
        p.pages = m.page.split('-').map(p => p.toString());
      }
      p.isbn= m.ISBN;
      p.issn = m.ISSN;


      let i = m.issued['date-parts'][0];
      if (i.length === 1) {
        p.published = i[0].toString();
      } else if (i.length === 2) {
        p.published = new Date(i[0], i[1]-1, 1, 12).toISOString().split('T')[0];
      } else {
        p.published = new Date(i[0], i[1]-1, i[2], 12).toISOString().split('T')[0];
      }

      if (m.type) {
        p.publication_type = publication_type(m.type);
      }

      if (m.license && !p.license) {
        let license = m.license.find(l => (/creativecommons\.org/).test(l.URL));
        if (license) {
          p.license = license.URL;
        }
      }

      /*  let authors = p.people.filter(p => p.roles.includes('author'));
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
        */
        if (m.publisher) {
          let publisher = { name: m.publisher, roles: ['publisher']};
          p.organisations.push(publisher);
        }

        if (m.funder) {
          p.organisations = p.organisations.concat(m.funder.map(f => {
            return { name: f.name, roles: ['funder'] };
        }));
          // http://data.crossref.org/v1/fundingdata/funder/10.13039/501100005416
          // http://api.crossref.org/v1/members/340
        }
        if (!p.tags) {
          p.tags = [];
        }
        if (m.subject && m.subject instanceof Array) {
          p.tags = p.tags.concat(m.subject.map(s => s.trim().replace(/\(all\)$/, '')));
        }
        p.tags.push('crossref.org');
        p.tags = unique(p.tags);
        /*
        if (p.title !== m.title[0]) {
          NpolarMessage.error(`Title does not match title in DOI ${doi}`);

        }
        // @todo link rel via =>
        // https://api.crossref.org/v1/works/10.1016/j.cor.2015.07.003
      */
      console.log('CrossrefWorks -> publication', p);
      return p;
    }

  };

}
module.exports = CrossrefWorks;