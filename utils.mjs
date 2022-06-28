import Web3 from 'web3';
export const web3 = new Web3("https://bsc-dataseed1.binance.org");

import {readFileSync, writeFileSync} from 'fs';

export function _saveCache(fname, data) { 
  writeFileSync(fname, JSON.stringify(data));
}

export function _loadCache(fname) {
  try {
     let rawdata = readFileSync(fname);
     let cache = JSON.parse(rawdata);
     return cache;
  } catch(err) {
     return null;
  }
}

export function lcStrings(x) { return typeof x === 'string' ? x.toLowerCase() : x; }

export function hexToBlob(x) { return x ? Buffer.from(x.substring(2), 'hex') : x; }
  
export default web3;