import { web3, lcStrings, hexToBlob } from './utils.mjs';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { _loadCache } from './cache-fs.mjs';

async function prepareBlock(blockNumber) { 
  let cname = 'cache/block_'+blockNumber+'.json';
  let cache = await _loadCache(cname);
  if (cache == null) {
    console.log('not found in cache', blockNumber);
    return;
  }

  let block = {};
  const excludes = [ 'transactions', 'uncles', 'nonce', '_transactions_receipts', 'miner', 'mixHash', 'parentHash', 'sha3Uncles', 'receiptsRoot', 'stateRoot', 'transactionsRoot' ];
  const blob = ['extraData','hash','logsBloom'];
  for (let field of Object.keys(cache)) {
    if (excludes.indexOf(field) != -1) { continue; }
    
    block[field] = blob.indexOf(field) == -1 ? lcStrings(cache[field]) : hexToBlob(cache[field]);
  }
  
  let transactions = [];
  let logs = [];

  const txn_blob = ['to','from','input','hash','contractAddress'];
  for (let t in cache._transactions_receipts) {
    let { from, gas, gasPrice, hash, input, nonce, to, transactionIndex, value, contractAddress, gasUsed, status } = cache._transactions_receipts[t];
    let row = { blockNumber, from, gas, gasPrice, hash, input, nonce, to, transactionIndex, value, contractAddress, gasUsed, status };
    //row.input = row.input.substring(2,18);
    for (let f of txn_blob) { row[f] = hexToBlob(row[f]); }
    transactions.push( row );
  }
 
  return {block, transactions, logs};
}

async function createTables(db) {

let create_blocks = `
  CREATE TABLE IF NOT EXISTS blocks (
  )
`;

let create_transactions = `
  CREATE TABLE IF NOT EXISTS transactions (
    blockNumber INTEGER,
    hash BLOB PRIMARY KEY,
    from_ BLOB,
    to_ BLOB,
    input BLOB,
    value STRING,
    gas INTEGER,
    gasPrice STRING,
    gasUsed INTEGER,
    nonce BLOB,
    transactionIndex INTEGER,
    status BOOLEAN
  );
`;

db.exec(create_transactions);

}

///////

const db = await open({
    filename: 'blocks.db',
    driver: sqlite3.Database
  });
//new sqlite3.Database('./blocks.db');

//db.serialize( () => {

  createTables(db);
  const stmt = await db.prepare("INSERT INTO transactions VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  db.exec(`
    PRAGMA main.page_size = 4096;
    PRAGMA main.cache_size=10000;
    PRAGMA main.locking_mode=EXCLUSIVE;
    PRAGMA main.synchronous=NORMAL;
    PRAGMA main.journal_mode=WAL;
    PRAGMA main.cache_size=5000;
  `);
    
  
  let first = parseInt(process.argv[2]);
  let last = parseInt(process.argv[3]) || first+1;
  for (let i=first; i<last; i++) {
    console.log(i);
    let {block, transactions, logs} = await prepareBlock(i);
    await db.exec('BEGIN TRANSACTION;');
    for (let t of transactions) {
      await stmt.run([ t.blockNumber, t.hash, t.from, t.to, t.input, t.value, t.gas, t.gasPrice, t.gasUsed, t.nonce, t.transactionIndex, t.status ]);
    }
    await db.exec('END TRANSACTION;');

    console.log('inserted', transactions.length, 'transactions');
  }
  
  await stmt.finalize();      

db.close();
