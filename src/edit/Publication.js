'use strict';

//  @todo Mv BibTeX out
let bibtexParse = require('bibtex-parse-js');

function Publication(NpdcDOI, NpdcCitationModel, PublicationResource, PublicationBibTeX, NpdcBibTeX, NpdcAPA, Person, NpolarTranslate, NpolarMessage , NpolarApiSecurity) {
  'ngInject';

  let self = this;

  const schema = 'http://api.npolar.no/schema/publication-1';
  const PROGRAMME_ECOTOXICOLOGY = 'Environmental pollutants';
  const PROGRAMME_BIODIVERSITY = 'Biodiversity';
  // Oceans and sea ice (184) Geology and geophysics (139) ICE Fluxes (76) ICE Ecosystems (38) ICE Antarctica (29) N-ICE2015 (27) N-ICE (17) ICE (10) Environmental management (6) Fram Strait (1)

  const uri = (p) => {
    if (!p) { return; }

    if (p.doi) {
      return NpdcDOI.uri(p.doi);
    }

    let publicationLink = (p.links||[]).find(l => l.rel === 'publication' && l.href);
    if (publicationLink) {
      return publicationLink.href;
    } else {
      return `https://data.npolar.no/publication/${p.id}`;
    }
  };

  const citationMapper = (publication, param={style: 'apa'}) => {
    if (!publication) {
      return;
    }
    let style = param.style;

    let authors = NpdcCitationModel.authors(publication);
    let author = authors;
    // if 0 authors => co-authors or editors?

    let year = new Date(publication.published).getFullYear();
    let month = new Date(publication.released).getMonth()+1;
    let day = new Date(publication.released).getDate();

    let title = publication.title;
    let type;

    let publisher = '';

    if (publication.journal && publication.journal.name) {
      // Publisher is either journal
      publisher = publication.journal.name;
    } else {
      // or organisation with role publisher
      publisher = NpdcCitationModel.publisher(publication).name;
    }
    // @todo append organisation[role=publisher] ?

    let uri2 = uri(publication);
    let url = uri2;
    let doi = publication.doi;

    if ((/apa/i).test(style)) {
      type = publication.publication_type;
      return NpdcAPA.citation({ authors, year, title, type, publisher, uri: uri2 });
    } else if ((/bibtex/i).test(style)){
      type = '@misc';
      return NpdcBibTeX.bibtex({ title, url, doi, type, publisher, author, year, id: publication.id });
    } else if ((/csl/i).test(style)){
      type = 'publication';
      let issued = { 'date-parts': [year, month, day], 'date-time': publication.released };
      return self.csl({ type, DOI: doi, URL: url, title, publisher, issued, author });
    } else {
      throw `Uknown citation style: ${style}`;
    }
  };

  //Biodiversity (398) Oceans and sea ice (182) Geology and geophysics (138) Environmental pollutants (122) ICE Fluxes (76) ICE Ecosystems (38) ICE Antarctica (29)
  //N-ICE (17) N-ICE2015 (15) ICE (10) Environmental management (6) Fram Centre Flagship Arctic Ocean (2) Fram Strait (1) MOSJ, COAT (1)

  // geo (33)  miljogift (29) havkryo (24) biodiv (21) ice (21) forvaltning (14)
  // kart (12) komm (12) havis (10) okosystemer (8)
  // bio (1)
  const programmeFromOrgtree = (orgtree) => {
    let o = JSON.stringify(orgtree);
    if ((/(miljogift|data)/).test(o)) {
      return PROGRAMME_ECOTOXICOLOGY;
    } else if ((/biodiv|okosystemer|bio/).test(o)) {
      return PROGRAMME_BIODIVERSITY;
    } else if ((/havkryo|havis/).test(o)) {
      return 'Oceans and sea ice';
    } else if ((/geo/).test(o)) {
      return 'Geology and geophysics';
    }
  };

  const topicFromProgramme = (programme) => {
    if (PROGRAMME_ECOTOXICOLOGY === programme) {
      return 'ecotoxicology';
    }
  };

  return Object.assign(PublicationResource, {


    citationList: (document, citation=citationMapper) => {

      let list = [{ text: citation(document, { style: 'apa'}), title: 'APA'},
        { text: citation(document, { style: 'bibtex'}), title: 'BibTeX'}
      ];

      // Use Datacite citation service for publications with a DOI
      if (document.doi) {
        list = list.concat([
          //{ href: `//citation.datacite.org/format?doi=${document.doi}&style=apa&lang=en-GB`, title: 'APA'},
          //{ href: `//citation.datacite.org/format?doi=${document.doi}&style=bibtex&lang=en-GB`, title: 'BibTeX'},
          { href: `//api.crossref.org/works/${document.doi}/transform/application/vnd.citationstyles.csl+json`, title: 'CSL JSON'},
          { href: `//api.crossref.org/works/${document.doi}/transform/application/x-research-info-systems`, title: 'RIS'},
          //{ href: `//api.crossref.org/works/${document.doi}/transform/application/vnd.crossref.unixref+xml`, title: 'Crossref XML'}
        ]);
      }

      list = list.sort((a,b) => a.title.localeCompare(b.title));

      if (document.citation) {
        list = [{ text: document.citation, title: 'Custom'}].concat(list);
      }
      return list;
    },

    metadata: (publication, resource, id=uri(publication)) => {
      let path = resource.path.replace('//api.npolar.no', '');
      let byline = NpolarTranslate.translate('byline.publication_catalogue');

      return {
        uri:id,
        path,
        formats: [{ href: `//api.npolar.no/publication/${publication.id}`, title: "JSON", type: "application/json"}],
        editors: [],
        byline,
        schema
      };
    },

    uri,

    schema,

    isOpen: function(p) {

      let openAccessJournals = ['Marine Ecology Progress Series','polar research', 'plos one', 'np report series', 'meddelelser', 'np brief report series', 'skrifter', 'temakart', 'thematic'];

      if (p.journal && p.journal.np_series && !p.journal.name) {
        p.journal.name = p.journal.np_series;
        //Other (339) NP Report Series (66) Meddelelser (32) NP Brief Report Series (23) Skrifter (11) Thematic (11) o (1)
      }

      let open = false;
      /*if (p.organisations && p.organisations instanceof Array && p.organisations.length > 0) {
        //code
      }*/

      if (p.license && (/^http/).test(p.license)) {
        console.debug(`OA license: ${p.license}`);
        open = true;
      } else if (p.organisations && (p.organisations||[]).find(o => (o.roles||[]).includes('publisher') && (o.id === 'npolar.no'))) {
        console.debug(`OA publisher: npolar.no`);
        open = true;
      } else if (p.journal && openAccessJournals.map(j => j.toLowerCase()).includes(p.journal.name.toLowerCase())) {
        console.debug(`OA journal: ${p.journal.name}`);
        open = true;
      } else if (['poster', 'abstract', 'map', 'proceedings'].includes(p.publication_type)) {
        console.debug(`OA publication type: ${p.publication_type}`);
        open = true;
      }
      // else if norsk polarinstitut Temakart [etc piub serueis ko]
      return open;
    },

    create: function() {

      let user;
      let person;
      let people;
      let organisations;
      let organisation = 'npolar.no';
      let collection = 'publication';
      let publication_type = 'other';
      let topics = ['other'];
      let title = null;
      let published = new Date().getFullYear();
      let publication_lang = 'en';
      let programme;
      //let locations = [{ country: 'NO'}];

      if (NpolarApiSecurity.isAuthenticated()) {
        user = NpolarApiSecurity.getUser();
        let id = user.email||'';
        let email = user.email||'';
        let [first_name,last_name] = user.name.split(' ');
        organisation = user.email.split('@')[1];
        let affiliation = [{ '@id': organisation }];
        person = { id, roles: ['author'], first_name, last_name, email, organisation, affiliation };

        programme = [programmeFromOrgtree(user.orgtree)];
        topics = [topicFromProgramme(programme[0])];
        people = [person];
      } else {
        people = [];
        organisations = [];
      }

      if (organisation === 'npolar.no') {
        let npolar = { id: organisation, name: 'Norsk Polarinstitutt', roles: ['originator'] };
        organisations = [npolar];
      }

      let p = { title, publication_type, publication_lang, collection, schema,
        published,
        people, organisations, topics, programme,
        state:'published',
        draft:'no'
      };
      console.debug('Publication.create()', p);
      return p;

    },

    // Import [BibTeX](https://en.wikipedia.org/wiki/BibTeX) import into a Npolar Publication reference
    importBibTeX(bibtex, into) {
      return PublicationBibTeX.importBibTeX(bibtex,into);
    },

    isBibTeX(text) {
      if (undefined === text) {
        return false;
      }

      try {
        //http://citation-needed.services.springer.com/v2/references/10.1007/s00300-015-1876-8?format=bibtex&flavour=citation
        bibtexParse.toJSON(text);
        return true;
      } catch (e) {
        return false;
      }
    },

    preParseBibTeX(text) {
      /*['TITLE', 'DOI', 'AUTHOR', 'JOURNAL', 'VOLUME', 'URL', 'YEAR', 'NUMBER'].forEach(tag => {
         text = text.replace(tag, tag.toLowerCase());
      });*/

   /*
      AUTHOR = {Drews, R. and Brown, J. and Matsuoka, K. and Witrant, E. and Philippe, M. and Hubbard, B. and Pattyn, F.},
TITLE = {Constraining variable density of ice shelves using wide-angle radar measurements},
JOURNAL = {The Cryosphere},
VOLUME = {10},
YEAR = {2016},
NUMBER = {2},
PAGES = {811--823},
URL = {http://www.the-cryosphere.net/10/811/2016/},
DOI = {10.5194/tc-10-811-2016}
}*/

      return text; //.toLowerCase();
    },

    parseBibTeX(text) {
      return bibtexParse.toJSON(text);
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