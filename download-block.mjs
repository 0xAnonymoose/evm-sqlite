import { web3, lcStrings } from './utils.mjs';
import { _checkCache, _saveCache, _loadCache } from './cache-fs.mjs';
import { setTimeout } from 'timers/promises';

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

const THROTTLE = parseInt(process.env.THROTTLE || 400);

async function downloadBlock(blockNumber) { 
  let cname = 'cache/block_'+blockNumber+'.json';
  if (await _checkCache(cname)) { return await _loadCache(cname); }
  
  let start_ts = Date.now();  
  let b;

  // get block header  
  console.log('block', blockNumber);
  try { 
    b = await web3.eth.getBlock( blockNumber );
    b._transactions_receipts = {};
  } catch(e) {
    console.error(blockNumber,'failed', e);
    return null;
  }

  // get transactions and receipts
  const TXN_TRIES = 3;
  for(let t of b.transactions) {
  
      // try a few times.
      let ok = false;
      for (let j=0; j<TXN_TRIES && !ok; j++) {
        console.log(t, j);
        
        try {
          let txn = await web3.getBigGasLimitTransaction( t );
          let rcpt = await web3.eth.getTransactionReceipt( t  );
          b._transactions_receipts[t] = prepareTransaction(txn, rcpt);
          ok=true;
        } catch(e) {
          console.error(t, 'failed', e);
        }
         
        await setTimeout( ok ? THROTTLE : 5000);
      }
      
      if (!ok) {
        // catastrophic error, bail out
        return null;
      }
      
    }


  let end_ts = Date.now();
  console.log(blockNumber,' ', b.transactions.length,'txn',end_ts-start_ts,'sec');
  await _saveCache(cname, b);
  
  return b;
}

const MAX_TRIES = 10;
const RETRY_DELAY = 60*1000;

let first = parseInt(process.argv[2]);
let last = parseInt(process.argv[3]) || first+1;
for (let i=first; i<last; i++) {
  for (let tries=0; tries<MAX_TRIES; tries++) {
    let b = await downloadBlock(i);
    if (b != null) { break; }
    await setTimeout(RETRY_DELAY);
  }
}
