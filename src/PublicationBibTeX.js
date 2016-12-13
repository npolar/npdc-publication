'use strict';

let bibtexParse = require('bibtex-parse-js');

function PublicationBibTeX(NpolarMessage) {
  'ngInject';

  // thx https://gist.github.com/bendc/9b05735dfa6966859025
  const unique = (arr) => [ ... new Set(arr)];

  return {
    // Import [BibTeX](https://en.wikipedia.org/wiki/BibTeX) import into a Npolar Publication reference
    importBibTeX(bibtex, into) {

      console.debug('PublicationBibTeX.importBibTex()', 'BibTeX', bibtex, 'into', into);
      function isDoi(s) {
        return ((/^(.{1,})?10\.[0-9]{3,}\/.+/).test(s));
      }

      function getDoi(s) {
        return '10.'+s.split('10.')[1];
      }

      function getPublicationType(entryType) {
        return 'peer-reviewed';
      }

      function authors(authorText) {
        if ((/\sand\s/i).test(authorText)) {
          return authorText.split(/\sand\s/i).map(fragment => {
            let person = { roles: ['author'] };

            let n = fragment.split(',');
            let last_name = (n[0]||fragment).trim();
            let first_name = (n[1]||'').trim();

            if (first_name === '' && (/\s/).test(last_name)) {
              let n = last_name.split(' ');
              last_name = n.pop();
              first_name = n.join(' ');
            }
            // ORCID?
            person.last_name = last_name;
            person.first_name = first_name;
            return person;

          });
        } else {
          return [{ first_name: '', last_name: authorText, roles: ['author'] }];
        }
      }

      let entryType = bibtex.entryType.toLowerCase().trim();

      if (true) {

        let b = bibtex.entryTags;

        // Force lowe case keys
        Object.keys(b).forEach(k => {
          if (k.toLowerCase() !== k) {
            b[k.toLowerCase()] = b[k];
            delete b[k];
          }
        });

        console.log('entryTags [after]', b);


        if (b.title) {
          into.title = b.title.trim();
        }

        into.publication_type = 'peer-reviewed';

        if (b.author) {
          into.people = authors(b.author);
        }

        if (b.year) {
          into.published = b.year.toString();
        }

        if (b.journal) {
          into.journal.name = b.journal.trim();
        }

        if (b.volume) {
          into.volume = b.volume;
        }

        if (b.number) {
          into.issue = b.number.toString().trim();
        }

        if (isDoi(b.doi)) {
          into.doi = getDoi(b.doi);
        }

        if (!into.links) {
          into.links = [];
        }

        if (!isDoi(into.doi) && isDoi(b.doi)) {
          into.doi = b.doi;
        }

        if (b.url) {
          if (isDoi(b.url)) {
            let doi = getDoi(b.url);
            let doiHref = 'http://doi.org/'+doi;
            into.links = into.links.filter(l => !isDoi(l.href));
            into.links.push({ href: doiHref, rel: 'doi', title: doi });
            into.doi = doi;
          } else {
            into.links.push({ href: b.url, rel: 'related'});
          }
        }
        into.links = unique(into.links);

        if (b.issn) {
          into.issn = [b.issn.toString()];
        }
        if (b.isbn) {
          into.isbn = [b.isbn.toString()];
        }

        if (!into.tags) {
          into.tags = [];
        }
        if (bibtex.citationKey) {
          into.tags.push(bibtex.citationKey);
        }

        if (b.keywords) {
          if (/[,;]/.test(b.keywords)) {
            let keywords = b.keywords.split(/[,;]/);
            into.tags = into.tags.concat(keywords);
          } else {
            into.tags.push(b.keywords);
          }
        }
        into.tags = into.tags.sort().map(t => t.trim());
        into.tags = unique(into.tags);

        if (b.pages && (/[0-9]+-(-)?[0-9]+/).test(b.pages)) {
          into.pages = b.pages.replace(/-(-)?/g, ';').split(';');
        }

        if (b.note) {
          if (!into.comment) {
            into.comment = b.note;
          }
        }

        if (b['abstract'] && into.abstract.length === 0) {
          into['abstract'] = [{ '@language': 'en', '@value': b.abstract}];
        }
        console.debug('importBibTex() returns:', into);
        return into;

      }
    },

    isBibTeX(text) {
      if (undefined === text) {
        return false;
      }

      try {
        bibtexParse.toJSON(text);
        return true;
      } catch (e) {
        return false;
      }
    },

    parseBibTeX(text) {
      return bibtexParse.toJSON(text);
    }

  };

}
module.exports = PublicationBibTeX;