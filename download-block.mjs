import { _loadCache, _saveCache, web3, lcStrings } from './utils.mjs';

function prepareTransaction(txn, receipt) {

  // duplicate the transaction object, lowrecase all strings
  let tcopy = {}
  for (let f of Object.keys(txn)) {
    tcopy[f] = lcStrings( txn[f] );
  }
  
  // merge receipt fields
  const rfields = [ 'contractAddress', 'cumulativeGasUsed', 'gasUsed', 'logsBloom', 'logs', 'status' ];
  for (let f of rfields) {
    tcopy[f] = lcStrings( receipt[f] );
  }

  return tcopy;
}

async function downloadBlock(blockNumber) { 
  let cname = 'cache/block_'+blockNumber+'.json';
  let cache = _loadCache(cname);
  if (cache != null) { return cache; }
  
  let start_ts = Date.now();  
  let b = await web3.eth.getBlock( blockNumber );
  
  b._transactions_receipts = {};

  for(let t of b.transactions) {
    console.log(t);
    try {
      let txn = await web3.eth.getTransaction( t );
      let rcpt = await web3.eth.getTransactionReceipt( t  );
      b._transactions_receipts[t] = prepareTransaction(txn, rcpt);
    } catch(e) {
      console.error(e);
    }
  }

  let end_ts = Date.now();
  console.log(blockNumber,' ', b.transactions.length,'txn',end_ts-start_ts,'sec');
  _saveCache(cname, b);
  
  return b;
}

let first = parseInt(process.argv[2]);
let last = parseInt(process.argv[3]) || first+1;
for (let i=first; i<last; i++) {
  await downloadBlock(i);
}
