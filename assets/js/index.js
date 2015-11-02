'use strict';

var helpers = require('hof').toolkit.helpers;
var progressiveReveal = require('hof').toolkit.progressiveReveal;
var formFocus = require('hof').toolkit.formFocus;

helpers.documentReady(progressiveReveal);
helpers.documentReady(formFocus);

var $ = require('jquery');
var typeahead = require('typeahead.js-browserify');
var Bloodhound = require('typeahead.js-browserify').Bloodhound;

typeahead.loadjQueryPlugin();

var nonEuCountries = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  local: require('./countries').nonEuCountries
});

var allCountries = new Bloodhound({
  datumTokenizer: Bloodhound.tokenizers.whitespace,
  queryTokenizer: Bloodhound.tokenizers.whitespace,
  local: require('./countries').allCountries
});


$('#nationality, #nationality-error, #nominated-nationality')
.typeahead({
  minLength: 1,
  hint: false,
  limit: 5
}, {
  name: 'nonEuCountries',
  source: nonEuCountries
});

$('#country, #someone-else-nationality, #change-person-nationality').typeahead({
  minLength: 1,
  hint: false,
  limit: 5
}, {
  name: 'allCountries',
  source: allCountries
});
