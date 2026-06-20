/* ============ DONNÉES FÊTES NATIONALES ============
   ~195 pays organisés par continent et notoriété.
   Utilisé par normalize() dans storage.js pour pré-remplir
   le deck "Fêtes nationales" et migrer les données existantes.

   Système Majeur (consonnes) :
   0→S/Z · 1→T/D · 2→N · 3→M · 4→R · 5→L · 6→J/CH · 7→K/G · 8→F/V · 9→P/B
   Format hint : "JJ→X·X | MM→X·X"
*/
const MENT_FETES_DATA = [

  /* ───────── EUROPE ───────── */
  {
    name: 'Europe Lot 1 — phares',
    items: [
      { question: 'France',        answer: '14 juillet',     majorHint: '14→T·R | 07→S·K' },
      { question: 'Allemagne',     answer: '3 octobre',      majorHint: '03→S·M | 10→T·S' },
      { question: 'Italie',        answer: '2 juin',         majorHint: '02→S·N | 06→S·J' },
      { question: 'Espagne',       answer: '12 octobre',     majorHint: '12→T·N | 10→T·S' },
      { question: 'Portugal',      answer: '10 juin',        majorHint: '10→T·S | 06→S·J' },
      { question: 'Pays-Bas',      answer: '27 avril',       majorHint: '27→N·K | 04→S·R' },
      { question: 'Belgique',      answer: '21 juillet',     majorHint: '21→N·T | 07→S·K' },
      { question: 'Suisse',        answer: '1er août',       majorHint: '01→S·T | 08→S·F' },
      { question: 'Autriche',      answer: '26 octobre',     majorHint: '26→N·J | 10→T·S' },
      { question: 'Grèce',         answer: '25 mars',        majorHint: '25→N·L | 03→S·M' },
    ]
  },
  {
    name: 'Europe Lot 2 — connus',
    items: [
      { question: 'Pologne',       answer: '11 novembre',    majorHint: '11→T·T | 11→T·T' },
      { question: 'Suède',         answer: '6 juin',         majorHint: '06→S·J | 06→S·J' },
      { question: 'Norvège',       answer: '17 mai',         majorHint: '17→T·K | 05→S·L' },
      { question: 'Danemark',      answer: '5 juin',         majorHint: '05→S·L | 06→S·J' },
      { question: 'Finlande',      answer: '6 décembre',     majorHint: '06→S·J | 12→T·N' },
      { question: 'Irlande',       answer: '17 mars',        majorHint: '17→T·K | 03→S·M' },
      { question: 'Russie',        answer: '12 juin',        majorHint: '12→T·N | 06→S·J' },
      { question: 'Ukraine',       answer: '24 août',        majorHint: '24→N·R | 08→S·F' },
      { question: 'Turquie',       answer: '29 octobre',     majorHint: '29→N·P | 10→T·S' },
      { question: 'Roumanie',      answer: '1er décembre',   majorHint: '01→S·T | 12→T·N' },
    ]
  },
  {
    name: 'Europe Lot 3 — moyens',
    items: [
      { question: 'Hongrie',       answer: '20 août',        majorHint: '20→N·S | 08→S·F' },
      { question: 'Rép. tchèque',  answer: '28 octobre',     majorHint: '28→N·F | 10→T·S' },
      { question: 'Slovaquie',     answer: '1er janvier',    majorHint: '01→S·T | 01→S·T' },
      { question: 'Croatie',       answer: '30 mai',         majorHint: '30→M·S | 05→S·L' },
      { question: 'Serbie',        answer: '15 février',     majorHint: '15→T·L | 02→S·N' },
      { question: 'Luxembourg',    answer: '23 juin',        majorHint: '23→N·M | 06→S·J' },
      { question: 'Islande',       answer: '17 juin',        majorHint: '17→T·K | 06→S·J' },
      { question: 'Bulgarie',      answer: '3 mars',         majorHint: '03→S·M | 03→S·M' },
      { question: 'Slovénie',      answer: '25 juin',        majorHint: '25→N·L | 06→S·J' },
      { question: 'Albanie',       answer: '28 novembre',    majorHint: '28→N·F | 11→T·T' },
    ]
  },
  {
    name: 'Europe Lot 4 — peu connus',
    items: [
      { question: 'Macédoine du Nord', answer: '8 septembre',  majorHint: '08→S·F | 09→S·P' },
      { question: 'Monténégro',        answer: '13 juillet',   majorHint: '13→T·M | 07→S·K' },
      { question: 'Bosnie-Herzégovine',answer: '25 novembre',  majorHint: '25→N·L | 11→T·T' },
      { question: 'Kosovo',            answer: '17 février',   majorHint: '17→T·K | 02→S·N' },
      { question: 'Moldavie',          answer: '27 août',      majorHint: '27→N·K | 08→S·F' },
      { question: 'Biélorussie',       answer: '3 juillet',    majorHint: '03→S·M | 07→S·K' },
      { question: 'Lituanie',          answer: '16 février',   majorHint: '16→T·J | 02→S·N' },
      { question: 'Lettonie',          answer: '18 novembre',  majorHint: '18→T·F | 11→T·T' },
      { question: 'Estonie',           answer: '24 février',   majorHint: '24→N·R | 02→S·N' },
      { question: 'Chypre',            answer: '1er octobre',  majorHint: '01→S·T | 10→T·S' },
    ]
  },
  {
    name: 'Europe Lot 5 — micro-États',
    items: [
      { question: 'Monaco',        answer: '19 novembre',    majorHint: '19→T·P | 11→T·T' },
      { question: 'Andorre',       answer: '8 septembre',    majorHint: '08→S·F | 09→S·P' },
      { question: 'Liechtenstein', answer: '15 août',        majorHint: '15→T·L | 08→S·F' },
      { question: 'Saint-Marin',   answer: '3 septembre',    majorHint: '03→S·M | 09→S·P' },
      { question: 'Malte',         answer: '21 septembre',   majorHint: '21→N·T | 09→S·P' },
      { question: 'Vatican',       answer: '11 février',     majorHint: '11→T·T | 02→S·N' },
    ]
  },

  /* ───────── AMÉRIQUES ───────── */
  {
    name: 'Amériques Lot 1 — phares',
    items: [
      { question: 'États-Unis',    answer: '4 juillet',      majorHint: '04→S·R | 07→S·K' },
      { question: 'Canada',        answer: '1er juillet',    majorHint: '01→S·T | 07→S·K' },
      { question: 'Mexique',       answer: '16 septembre',   majorHint: '16→T·J | 09→S·P' },
      { question: 'Brésil',        answer: '7 septembre',    majorHint: '07→S·K | 09→S·P' },
      { question: 'Argentine',     answer: '25 mai',         majorHint: '25→N·L | 05→S·L' },
      { question: 'Colombie',      answer: '20 juillet',     majorHint: '20→N·S | 07→S·K' },
      { question: 'Cuba',          answer: '1er janvier',    majorHint: '01→S·T | 01→S·T' },
      { question: 'Chili',         answer: '18 septembre',   majorHint: '18→T·F | 09→S·P' },
      { question: 'Pérou',         answer: '28 juillet',     majorHint: '28→N·F | 07→S·K' },
      { question: 'Venezuela',     answer: '5 juillet',      majorHint: '05→S·L | 07→S·K' },
    ]
  },
  {
    name: 'Amériques Lot 2 — connus',
    items: [
      { question: 'Équateur',      answer: '10 août',        majorHint: '10→T·S | 08→S·F' },
      { question: 'Bolivie',       answer: '6 août',         majorHint: '06→S·J | 08→S·F' },
      { question: 'Paraguay',      answer: '14 mai',         majorHint: '14→T·R | 05→S·L' },
      { question: 'Uruguay',       answer: '25 août',        majorHint: '25→N·L | 08→S·F' },
      { question: 'Guatemala',     answer: '15 septembre',   majorHint: '15→T·L | 09→S·P' },
      { question: 'Honduras',      answer: '15 septembre',   majorHint: '15→T·L | 09→S·P' },
      { question: 'El Salvador',   answer: '15 septembre',   majorHint: '15→T·L | 09→S·P' },
      { question: 'Nicaragua',     answer: '15 septembre',   majorHint: '15→T·L | 09→S·P' },
      { question: 'Costa Rica',    answer: '15 septembre',   majorHint: '15→T·L | 09→S·P' },
      { question: 'Panama',        answer: '3 novembre',     majorHint: '03→S·M | 11→T·T' },
    ]
  },
  {
    name: 'Amériques Lot 3 — Caraïbes',
    items: [
      { question: 'Haïti',                 answer: '1er janvier',  majorHint: '01→S·T | 01→S·T' },
      { question: 'Rép. dominicaine',      answer: '27 février',   majorHint: '27→N·K | 02→S·N' },
      { question: 'Jamaïque',              answer: '6 août',       majorHint: '06→S·J | 08→S·F' },
      { question: 'Trinidad-et-Tobago',    answer: '31 août',      majorHint: '31→M·T | 08→S·F' },
      { question: 'Bahamas',               answer: '10 juillet',   majorHint: '10→T·S | 07→S·K' },
      { question: 'Barbade',               answer: '30 novembre',  majorHint: '30→M·S | 11→T·T' },
      { question: 'Belize',                answer: '21 septembre', majorHint: '21→N·T | 09→S·P' },
      { question: 'Guyana',                answer: '26 mai',       majorHint: '26→N·J | 05→S·L' },
      { question: 'Suriname',              answer: '25 novembre',  majorHint: '25→N·L | 11→T·T' },
      { question: 'Grenade',               answer: '7 février',    majorHint: '07→S·K | 02→S·N' },
    ]
  },
  {
    name: 'Amériques Lot 4 — petits États',
    items: [
      { question: 'Saint-Kitts-et-Nevis',           answer: '19 septembre', majorHint: '19→T·P | 09→S·P' },
      { question: 'Antigua-et-Barbuda',              answer: '1er novembre', majorHint: '01→S·T | 11→T·T' },
      { question: 'Dominique',                       answer: '3 novembre',   majorHint: '03→S·M | 11→T·T' },
      { question: 'Sainte-Lucie',                    answer: '22 février',   majorHint: '22→N·N | 02→S·N' },
      { question: 'Saint-Vincent-et-les-Grenadines', answer: '27 octobre',   majorHint: '27→N·K | 10→T·S' },
    ]
  },

  /* ───────── ASIE & OCÉANIE ───────── */
  {
    name: 'Asie Lot 1 — phares',
    items: [
      { question: 'Chine',           answer: '1er octobre',   majorHint: '01→S·T | 10→T·S' },
      { question: 'Japon',           answer: '11 février',    majorHint: '11→T·T | 02→S·N' },
      { question: 'Corée du Sud',    answer: '15 août',       majorHint: '15→T·L | 08→S·F' },
      { question: 'Inde',            answer: '15 août',       majorHint: '15→T·L | 08→S·F' },
      { question: 'Pakistan',        answer: '14 août',       majorHint: '14→T·R | 08→S·F' },
      { question: 'Australie',       answer: '26 janvier',    majorHint: '26→N·J | 01→S·T' },
      { question: 'Nouvelle-Zélande',answer: '6 février',     majorHint: '06→S·J | 02→S·N' },
      { question: 'Vietnam',         answer: '2 septembre',   majorHint: '02→S·N | 09→S·P' },
      { question: 'Indonésie',       answer: '17 août',       majorHint: '17→T·K | 08→S·F' },
      { question: 'Philippines',     answer: '12 juin',       majorHint: '12→T·N | 06→S·J' },
    ]
  },
  {
    name: 'Asie Lot 2 — connus',
    items: [
      { question: 'Thaïlande',       answer: '28 juillet',    majorHint: '28→N·F | 07→S·K' },
      { question: 'Malaisie',        answer: '31 août',       majorHint: '31→M·T | 08→S·F' },
      { question: 'Singapour',       answer: '9 août',        majorHint: '09→S·P | 08→S·F' },
      { question: 'Bangladesh',      answer: '26 mars',       majorHint: '26→N·J | 03→S·M' },
      { question: 'Sri Lanka',       answer: '4 février',     majorHint: '04→S·R | 02→S·N' },
      { question: 'Myanmar',         answer: '4 janvier',     majorHint: '04→S·R | 01→S·T' },
      { question: 'Cambodge',        answer: '9 novembre',    majorHint: '09→S·P | 11→T·T' },
      { question: 'Laos',            answer: '2 décembre',    majorHint: '02→S·N | 12→T·N' },
      { question: 'Mongolie',        answer: '11 juillet',    majorHint: '11→T·T | 07→S·K' },
      { question: 'Népal',           answer: '29 mai',        majorHint: '29→N·P | 05→S·L' },
    ]
  },
  {
    name: 'Asie Lot 3 — peu connus',
    items: [
      { question: 'Corée du Nord',            answer: '9 septembre',   majorHint: '09→S·P | 09→S·P' },
      { question: 'Brunei',                   answer: '23 février',    majorHint: '23→N·M | 02→S·N' },
      { question: 'Timor-Leste',              answer: '20 mai',        majorHint: '20→N·S | 05→S·L' },
      { question: 'Bhoutan',                  answer: '17 décembre',   majorHint: '17→T·K | 12→T·N' },
      { question: 'Maldives',                 answer: '26 juillet',    majorHint: '26→N·J | 07→S·K' },
      { question: 'Afghanistan',              answer: '19 août',       majorHint: '19→T·P | 08→S·F' },
      { question: 'Papouasie-Nvlle-Guinée',   answer: '16 septembre',  majorHint: '16→T·J | 09→S·P' },
      { question: 'Fidji',                    answer: '10 octobre',    majorHint: '10→T·S | 10→T·S' },
      { question: 'Vanuatu',                  answer: '30 juillet',    majorHint: '30→M·S | 07→S·K' },
      { question: 'Samoa',                    answer: '1er juin',      majorHint: '01→S·T | 06→S·J' },
    ]
  },
  {
    name: 'Asie Lot 4 — Pacifique',
    items: [
      { question: 'Tonga',            answer: '4 novembre',   majorHint: '04→S·R | 11→T·T' },
      { question: 'Îles Salomon',     answer: '7 juillet',    majorHint: '07→S·K | 07→S·K' },
      { question: 'Micronésie',       answer: '10 mai',       majorHint: '10→T·S | 05→S·L' },
      { question: 'Kiribati',         answer: '12 juillet',   majorHint: '12→T·N | 07→S·K' },
      { question: 'Nauru',            answer: '31 janvier',   majorHint: '31→M·T | 01→S·T' },
      { question: 'Tuvalu',           answer: '1er octobre',  majorHint: '01→S·T | 10→T·S' },
      { question: 'Palau',            answer: '1er octobre',  majorHint: '01→S·T | 10→T·S' },
      { question: 'Îles Marshall',    answer: '1er mai',      majorHint: '01→S·T | 05→S·L' },
    ]
  },

  /* ───────── MOYEN-ORIENT ───────── */
  {
    name: 'Moyen-Orient Lot 1 — connus',
    items: [
      { question: 'Israël',           answer: '14 mai',        majorHint: '14→T·R | 05→S·L' },
      { question: 'Arabie saoudite',  answer: '23 septembre',  majorHint: '23→N·M | 09→S·P' },
      { question: 'Iran',             answer: '11 février',    majorHint: '11→T·T | 02→S·N' },
      { question: 'Irak',             answer: '3 octobre',     majorHint: '03→S·M | 10→T·S' },
      { question: 'Syrie',            answer: '17 avril',      majorHint: '17→T·K | 04→S·R' },
      { question: 'Liban',            answer: '22 novembre',   majorHint: '22→N·N | 11→T·T' },
      { question: 'Jordanie',         answer: '25 mai',        majorHint: '25→N·L | 05→S·L' },
      { question: 'Émirats arabes',   answer: '2 décembre',    majorHint: '02→S·N | 12→T·N' },
      { question: 'Qatar',            answer: '18 décembre',   majorHint: '18→T·F | 12→T·N' },
      { question: 'Koweït',           answer: '25 février',    majorHint: '25→N·L | 02→S·N' },
    ]
  },
  {
    name: 'Moyen-Orient Lot 2 — autres',
    items: [
      { question: 'Bahreïn',          answer: '16 décembre',   majorHint: '16→T·J | 12→T·N' },
      { question: 'Oman',             answer: '18 novembre',   majorHint: '18→T·F | 11→T·T' },
      { question: 'Yémen',            answer: '22 mai',        majorHint: '22→N·N | 05→S·L' },
      { question: 'Azerbaïdjan',      answer: '28 mai',        majorHint: '28→N·F | 05→S·L' },
      { question: 'Arménie',          answer: '21 septembre',  majorHint: '21→N·T | 09→S·P' },
      { question: 'Géorgie',          answer: '26 mai',        majorHint: '26→N·J | 05→S·L' },
      { question: 'Palestine',        answer: '15 novembre',   majorHint: '15→T·L | 11→T·T' },
    ]
  },

  /* ───────── ASIE CENTRALE ───────── */
  {
    name: 'Asie centrale',
    items: [
      { question: 'Kazakhstan',       answer: '16 décembre',   majorHint: '16→T·J | 12→T·N' },
      { question: 'Ouzbékistan',      answer: '1er septembre', majorHint: '01→S·T | 09→S·P' },
      { question: 'Turkménistan',     answer: '27 septembre',  majorHint: '27→N·K | 09→S·P' },
      { question: 'Kirghizistan',     answer: '31 août',       majorHint: '31→M·T | 08→S·F' },
      { question: 'Tadjikistan',      answer: '9 septembre',   majorHint: '09→S·P | 09→S·P' },
    ]
  },

  /* ───────── AFRIQUE ───────── */
  {
    name: 'Afrique du Nord',
    items: [
      { question: 'Maroc',            answer: '18 novembre',   majorHint: '18→T·F | 11→T·T' },
      { question: 'Algérie',          answer: '5 juillet',     majorHint: '05→S·L | 07→S·K' },
      { question: 'Tunisie',          answer: '20 mars',       majorHint: '20→N·S | 03→S·M' },
      { question: 'Égypte',           answer: '23 juillet',    majorHint: '23→N·M | 07→S·K' },
      { question: 'Libye',            answer: '24 décembre',   majorHint: '24→N·R | 12→T·N' },
      { question: 'Mauritanie',       answer: '28 novembre',   majorHint: '28→N·F | 11→T·T' },
      { question: 'Soudan',           answer: '1er janvier',   majorHint: '01→S·T | 01→S·T' },
    ]
  },
  {
    name: 'Afrique de l\'Ouest Lot 1',
    items: [
      { question: 'Sénégal',          answer: '4 avril',       majorHint: '04→S·R | 04→S·R' },
      { question: 'Côte d\'Ivoire',   answer: '7 août',        majorHint: '07→S·K | 08→S·F' },
      { question: 'Ghana',            answer: '6 mars',        majorHint: '06→S·J | 03→S·M' },
      { question: 'Nigeria',          answer: '1er octobre',   majorHint: '01→S·T | 10→T·S' },
      { question: 'Mali',             answer: '22 septembre',  majorHint: '22→N·N | 09→S·P' },
      { question: 'Guinée',           answer: '2 octobre',     majorHint: '02→S·N | 10→T·S' },
      { question: 'Togo',             answer: '27 avril',      majorHint: '27→N·K | 04→S·R' },
      { question: 'Bénin',            answer: '1er août',      majorHint: '01→S·T | 08→S·F' },
      { question: 'Burkina Faso',     answer: '11 décembre',   majorHint: '11→T·T | 12→T·N' },
      { question: 'Niger',            answer: '3 août',        majorHint: '03→S·M | 08→S·F' },
    ]
  },
  {
    name: 'Afrique de l\'Ouest Lot 2',
    items: [
      { question: 'Sierra Leone',     answer: '27 avril',      majorHint: '27→N·K | 04→S·R' },
      { question: 'Liberia',          answer: '26 juillet',    majorHint: '26→N·J | 07→S·K' },
      { question: 'Gambie',           answer: '18 février',    majorHint: '18→T·F | 02→S·N' },
      { question: 'Guinée-Bissau',    answer: '24 septembre',  majorHint: '24→N·R | 09→S·P' },
      { question: 'Guinée équatoriale',answer: '12 octobre',   majorHint: '12→T·N | 10→T·S' },
      { question: 'Cap-Vert',         answer: '5 juillet',     majorHint: '05→S·L | 07→S·K' },
      { question: 'São Tomé-et-Príncipe', answer: '12 juillet', majorHint: '12→T·N | 07→S·K' },
    ]
  },
  {
    name: 'Afrique centrale',
    items: [
      { question: 'Cameroun',         answer: '20 mai',        majorHint: '20→N·S | 05→S·L' },
      { question: 'Gabon',            answer: '17 août',       majorHint: '17→T·K | 08→S·F' },
      { question: 'Congo',            answer: '15 août',       majorHint: '15→T·L | 08→S·F' },
      { question: 'RD Congo',         answer: '30 juin',       majorHint: '30→M·S | 06→S·J' },
      { question: 'Centrafrique',     answer: '1er décembre',  majorHint: '01→S·T | 12→T·N' },
      { question: 'Tchad',            answer: '11 août',       majorHint: '11→T·T | 08→S·F' },
      { question: 'Soudan du Sud',    answer: '9 juillet',     majorHint: '09→S·P | 07→S·K' },
    ]
  },
  {
    name: 'Afrique de l\'Est',
    items: [
      { question: 'Éthiopie',         answer: '28 mai',        majorHint: '28→N·F | 05→S·L' },
      { question: 'Kenya',            answer: '12 décembre',   majorHint: '12→T·N | 12→T·N' },
      { question: 'Tanzanie',         answer: '26 avril',      majorHint: '26→N·J | 04→S·R' },
      { question: 'Ouganda',          answer: '9 octobre',     majorHint: '09→S·P | 10→T·S' },
      { question: 'Rwanda',           answer: '1er juillet',   majorHint: '01→S·T | 07→S·K' },
      { question: 'Burundi',          answer: '1er juillet',   majorHint: '01→S·T | 07→S·K' },
      { question: 'Érythrée',         answer: '24 mai',        majorHint: '24→N·R | 05→S·L' },
      { question: 'Djibouti',         answer: '27 juin',       majorHint: '27→N·K | 06→S·J' },
      { question: 'Somalie',          answer: '1er juillet',   majorHint: '01→S·T | 07→S·K' },
      { question: 'Comores',          answer: '6 juillet',     majorHint: '06→S·J | 07→S·K' },
    ]
  },
  {
    name: 'Afrique australe Lot 1',
    items: [
      { question: 'Afrique du Sud',   answer: '27 avril',      majorHint: '27→N·K | 04→S·R' },
      { question: 'Zimbabwe',         answer: '18 avril',      majorHint: '18→T·F | 04→S·R' },
      { question: 'Zambie',           answer: '24 octobre',    majorHint: '24→N·R | 10→T·S' },
      { question: 'Mozambique',       answer: '25 juin',       majorHint: '25→N·L | 06→S·J' },
      { question: 'Angola',           answer: '11 novembre',   majorHint: '11→T·T | 11→T·T' },
      { question: 'Namibie',          answer: '21 mars',       majorHint: '21→N·T | 03→S·M' },
      { question: 'Madagascar',       answer: '26 juin',       majorHint: '26→N·J | 06→S·J' },
      { question: 'Maurice',          answer: '12 mars',       majorHint: '12→T·N | 03→S·M' },
    ]
  },
  {
    name: 'Afrique australe Lot 2',
    items: [
      { question: 'Botswana',         answer: '30 septembre',  majorHint: '30→M·S | 09→S·P' },
      { question: 'Malawi',           answer: '6 juillet',     majorHint: '06→S·J | 07→S·K' },
      { question: 'Lesotho',          answer: '4 octobre',     majorHint: '04→S·R | 10→T·S' },
      { question: 'Eswatini',         answer: '6 septembre',   majorHint: '06→S·J | 09→S·P' },
      { question: 'Seychelles',       answer: '29 juin',       majorHint: '29→N·P | 06→S·J' },
    ]
  },

];
