//const UNISWAP = require('@uniswap/sdk')
const { ChainId, Token, TokenAmount, Pair, Route, Fetcher, WETH, Percent, Trade, TradeType } = require('@uniswap/sdk');
const Web3 = require('web3');
const ethers = require('ethers')
require("dotenv").config();
const HDWalletProvider = require('@truffle/hdwallet-provider');
var fs = require('fs')
const BigNumber = require('bignumber.js');
const { getDefaultProvider, getNetwork } = require('@ethersproject/providers');
let web3_kovan = new Web3(Web3.getDefaultProvider || "https://kovan.infura.io/v3/6a902b6def64463e871b2be28267dbf7")
let web3_mainnet = new Web3(Web3.getDefaultProvider || "https://mainnet.infura.io/v3/6fd2fd8e1b334661b0c38556bd48b257")
const chainId = ChainId.MAINNET;
const KOVAN_USDT = web3_kovan.utils.toChecksumAddress('0xf3e0d7bf58c5d455d31ef1c2d5375904df525105');
const DAI_MAINNET = web3_mainnet.utils.toChecksumAddress('0x6B175474E89094C44Da98b954EedeAC495271d0F');
const ETH_CONTRACT_ADDRESS = 0x0000000000000000000000000000000000000000;

//setup trade configuratioin and add to liquidity
const add = async () => {

    //Gather information to get the mid price, execution price and the next mid price prior to adding to the pool
    
    const amountIn = new BigNumber(1000000000000000) //0.001 ETH
    const usdt = await Fetcher.fetchTokenData(chainId,DAI_MAINNET);
    const weth = await WETH[chainId];
    const pair = await Fetcher.fetchPairData(usdt, weth);
    const route = new Route([pair], weth);
    const tokenAmount = new TokenAmount(weth, amountIn);
    const trade = new Trade( route,  tokenAmount, TradeType.EXACT_INPUT);
    
    let midPrice = route.midPrice.toSignificant(6);
    let executionPrice = trade.executionPrice.toSignificant(6);
    let nextMidPrice = trade.nextMidPrice.toSignificant(6);
    console.log(`Mid Price: ${midPrice}`);
    console.log(`Execution Price: ${executionPrice}`);
    console.log(`Next Mid Price: ${nextMidPrice}`);

    //setting up the data to add to the pool
    
    const slippageTolerance = new Percent('50','10000') //50 bips 1 bip = 0.050
    const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
    const path = [weth.address, usdt.address];
    const to = '0xB5A7b7658c8daA57AE9F538C0315d4fa44Fe0bE4';
    const deadline = Math.floor(Date.now()/1000) + 60 * 20;
    const inputTokenAmount = trade.inputAmount.raw;
    const outputTokenAmount = trade.outputAmount.raw
    const provider = ethers.getDefaultProvider('mainnet',{
        infura: process.env.MAINNET_INFURA
    })
    const signer = new ethers.Wallet("386cdf0dbac6075c8ccc38576e4262b003bff87a5f7d9699243b3f18c9b92d2c")
    const accounts = signer.connect(provider);
    const web3 = new Web3(new Web3.providers.HttpProvider("https://mainnet.infura.io/v3/6fd2fd8e1b334661b0c38556bd48b257"));
    
    const uniswap = new ethers.Contract(
        '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
        ['function swapETHForExactTokens(uint amountOut, address[] calldata path, address to, uint deadline) external payable returns (uint[] memory amounts)'],
        accounts
        );
        console.log(`${slippageTolerance} :: ${amountOutMin} :: ${path} :: ${to} :: ${deadline}`)
        const tx = await uniswap.swapETHForExactTokens(
            web3.utils.toHex(amountOutMin),
            path,
            to,
            deadline,
            {value : web3.utils.toHex(inputTokenAmount), gasLimit:  8000000, gasPrice: 2412500000 }
        )

        /*console.log(`Transation hash: ${tx.hash}`);
        const receipt = await tx.wait();
        console.log(`Transaction was mined in block ${receipt.blockNumber}`);
        console.log("debug3")*/
};



add()
.then(result => {
    console.log(`${result}`);
})
.catch(error => {
    console.log(`Error ${error}`)
})





