require('dotenv').config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
const infuraKey = process.env.MNEMONIC;
const fs = require('fs');
const { default: Web3 } = require('web3');
//const mnemonic = fs.readFileSync(".secret").toString().trim();
const privKeys = process.env.PRIVATE_KEY


module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: 8545,
      network_id: '66',
      gas: 8000000,
      gasPrice: 1000000000, // web3.eth.gasPrice
    },
    coverage: {
      host: 'localhost',
      port: 8555,
      network_id: '*',
      gas: 8000000,
      gasPrice: 1000000000, // web3.eth.gasPrice
    },
    kovan: {
      provider: new HDWalletProvider(process.env.KOVAN_PRIVATE_KEY, process.env.KOVAN_INFURA),
      network_id: 42,       // Kovan id
      gas: 5500000,        // Kovan has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
    ropsten: {
      provider: new HDWalletProvider(process.env.ROPSTEN_PRIVATE_KEY, process.env.ROPSTEN_INFURA),
      network_id: 3,       // Kovan id
      gas: 5500000,        // Kovan has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
    rinkeby: {
      //provider: new HDWalletProvider(process.env.MNEMONIC, process.env.INFURA),
      provider: new HDWalletProvider(process.env.PRIVATE_KEY, process.env.RINKEBY_INFURA),
      network_id: 4,       // Rinkeby's id
      gas: 5500000,        // Rinkeby has a lower block limit than mainnet
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: true     // Skip dry run before migrations? (default: false for public nets )
    },
    mainnet: {
      provider: new HDWalletProvider(process.env.MAINNET_PRIVATE_KEY, process.env.MAINNET_INFURA),
      network_id: 1,       // Mainnet id
      gasPrice: 71000000000,        
      gasLimit: 8000000,
      confirmations: 2,    // # of confs to wait between deployments. (default: 0)
      timeoutBlocks: 200,  // # of blocks before a deployment times out  (minimum/default: 50)
      skipDryRun: false     // Skip dry run before migrations? (default: false for public nets )
    }
  },
  compilers: {
    solc: {
      version: '0.6.6',
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        }
      }
    },
  },
  mocha: { // https://github.com/cgewecke/eth-gas-reporter
    reporter: 'eth-gas-reporter',
    reporterOptions : {
      currency: 'USD',
      gasPrice: 10,
      onlyCalledMethods: true,
      showTimeSpent: true,
      excludeContracts: ['Migrations']
    }
  }
};
