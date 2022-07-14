import { writeFileSync, readFileSync } from 'fs';

export function _checkCache(fname) {
  return (_loadCache(fname) !== null);
}

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
