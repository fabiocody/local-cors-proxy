#!/usr/bin/env node

import * as lcp from '../lib/index.js';
import commandLineArgs from 'command-line-args';

const optionDefinitions = [
  {name: 'port', alias: 'p', type: Number, defaultValue: 8010},
  {
    name: 'proxyPartial',
    type: String,
    defaultValue: '/proxy',
  },
  {name: 'proxyUrl', type: String},
  {name: 'credentials', type: Boolean, defaultValue: false},
  {name: 'origin', type: String, defaultValue: '*'},
];

try {
  const options = commandLineArgs(optionDefinitions);
  if (!options.proxyUrl) {
    throw new Error('--proxyUrl is required');
  }
  lcp.startProxy(options.port, options.proxyUrl, options.proxyPartial, options.credentials, options.origin);
} catch (error) {
  console.error(error);
}
