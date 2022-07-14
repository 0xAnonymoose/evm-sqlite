import Web3 from 'web3';
import utils from 'web3-utils';
import { formatters } from 'web3-core-helpers';

export const web3 = new Web3(process.env.BSC_RPC_ENDPOINT || "https://bsc-dataseed1.binance.org");

/* work around the nightmare which is https://github.com/ChainSafe/web3.js/issues/3936 */

const bigGasLimitTransactionFormatter = (tx) => {
  if (tx.blockNumber !== null) {
    tx.blockNumber = utils.hexToNumber(tx.blockNumber);
  }
  if (tx.transactionIndex !== null) {
    tx.transactionIndex = utils.hexToNumber(tx.transactionIndex);
  }
  tx.nonce = utils.hexToNumber(tx.nonce);
  tx.gas = formatters.outputBigNumberFormatter(tx.gas);
  tx.gasPrice = formatters.outputBigNumberFormatter(tx.gasPrice);
  tx.value = formatters.outputBigNumberFormatter(tx.value);
  if (tx.to && utils.isAddress(tx.to)) { // tx.to could be `0x0` or `null` while contract creation
    tx.to = utils.toChecksumAddress(tx.to);
  } else {
    tx.to = null; // set to `null` if invalid address
  }
  if (tx.from) {
    tx.from = utils.toChecksumAddress(tx.from);
  }
  return tx;
};

web3.extend({
    methods: [{
        name: 'getBigGasLimitTransaction',
        call: 'eth_getTransactionByHash',
        params: 1,
        inputFormatter: [null],
        outputFormatter: bigGasLimitTransactionFormatter
    }]
});

export function lcStrings(x) { return typeof x === 'string' ? x.toLowerCase() : x; }

export function hexToBlob(x) { return x ? Buffer.from(x.substring(2), 'hex') : x; }

