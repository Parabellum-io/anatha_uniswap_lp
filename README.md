# Overview

This is a smart contract integration with Uniswap In/Out Liquidity.

## Project Setup

1. truffle init
2. npm init
3. npm install

## Dependencies

npm i --save @uniswap/v2-core
npm i --save @uniswap/v2-periphery

## Test Contract

After following the [quick-start Smart Contract Integration](https://uniswap.org/docs/v2/smart-contract-integration/quick-start) in Uniswap site, follow the steps below to test the contract

1. Bring up a testnet
2. Deploy the UniswapV2Factory
3. Deploy at least 2 ERC20 tokens for a pair
4. Create a pair for the factory
5. Deploy your LiquidityValueCalculator contract
6. Call LiquidityValueCalculator#computeLiquidityShareValue
7. Verify the result with an assertion

To get the bytecode for deploying UniswapV2Factory, you can import the file via:

`const UniswapV2FactoryBytecode = require('@uniswap/v2-core/build/UniswapV2Factory.json').bytecod`