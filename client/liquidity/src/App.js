import './App.css';
import logo from './logo.svg';
import React, {useState, useEffect, Component} from 'react'
import { ReactDOM } from 'react-dom'
import {Tab, Tabs, TabList, TabPanel} from 'react-tabs'
import 'react-tabs/style/react-tabs.css';
import { Link, useHistory } from 'react-router-dom'
import Select from "react-select";
import axios from 'axios';
import BigNumber from 'bignumber.js';
//const { Fetcher, WETH, TokenAmount, Percent } = require('@uniswap/sdk')
//const UNISWAP = require('@uniswap/sdk')
import Web3 from 'web3';
import { ethers } from 'ethers'
import detectEthereumProvider from '@metamask/detect-provider';
import { EthereumTx, Transaction } from 'ethereumjs-tx'
import contract from 'truffle-contract'
import 'bootstrap/dist/css/bootstrap.min.css';
import NavBar from './Navbar';


import {
    WALLETADDRESS,
    PRIVATEKEY,
    INFURA,
    DAI,
    USDT,
    USDC,
    ETH,
    UNISWAPROUTER02,
    ANATHALP,
    NetworkChainId
} from './environment'

//Uniswap libraries
import { ChainId, Token, TokenAmount, Pair, Route, Fetcher, WETH, Percent, Trade, TradeType } from '@uniswap/sdk'
//import uniswapv2routerJSON from './UniswapV2Router.json';
import  balanceOfJSON  from './balanceofABI.json';
import anathalpJSON from './AnathaLP.json'
import uniswapv2router2ABI from './UniswapV2Router02.json'
import { isCommunityResourcable } from '@ethersproject/providers';
import { AppBar } from '@material-ui/core';

function App() {

    /*
        * just need to get wallet address and private key from Metamask connected address because we are interfacing with smart contract directly and not through meta mask
        */
    let ethereum = window.ethereum;
    ethereum.enable();
    const web3 = new Web3(Web3.currentProvider || INFURA)
    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = new ethers.Wallet(PRIVATEKEY);
    let account = signer.connect(provider);
    /*const anathalp = new ethers.Contract(
        ANATHALP,
        ['function appAddLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)'],
        account
        )*/
    const anathalp = new web3.eth.Contract(anathalpJSON, ANATHALP)

    
    sessionStorage.setItem('selectedaddress', ethereum.selectedAddress)
    
    let ethereumprovider = detectEthereumProvider();
    if(ethereumprovider) {
        console.log(`Ethereum successfully detected`)
    }
    else {
        console.log(`Unable to deteect Ethereum.  Need to install to use Metamask`)
    }

    const uniswaprouter = new web3.eth.Contract(uniswapv2router2ABI, UNISWAPROUTER02);
    const chainId = NetworkChainId;
    /*const USDT_KOVAN = web3.utils.toChecksumAddress(USDT);
    const DAI_KOVAN = web3.utils.toChecksumAddress(DAI);
    const ETH_CONTRACT_ADDRESS = ETH;*/
    
    const [httpprovider, sethttpprovider] = useState()
    const [selectednetwork, setselectednetwork] = useState(NetworkChainId) //safe settings 
    const [selected, setselected] = useState();
    const [selectedliquidity, setselectedliquidity] = useState();
    const [amounttoadd, setamounttoadd] = useState(0);
    const [amounttowithdraw, setamounttowithdraw] = useState();

    //price level data
    const [midPrice, setmidPrice] = useState();
    const [executionPrice, setexecutionPrice] = useState();
    const [nextMidPrice, setnextMidPrice] = useState();
    const [invertPrice, setinvertPrice] =  useState();

    //swap data settings
    const [trade, settrade] = useState();
    const [weth, setweth] = useState();
    const [usdt, setusdt] = useState();
    const [slippageTolerance, setslippageTolerance] = useState();
    
    const networkid = [
        {label:"KOVAN", value:42},
        {label:"MAINNET", value:1}
    ]

    const pools = [
        {label:"USDT", value: USDT},
        {label:"DAI", value:DAI},
        {label: "USDC", value:'USDC'},
        {value:ETH, label:"ETH"}
    ]

    const options = [
        {label:"USDT", value: USDT},
        {label:"DAI", value:DAI},
        {label: "USDC", value:'USDC'},
        {value:ETH, label:"ETH"}
    ];
    const defaultOption = options[0];

    const liquidityoptions = [
        {value: USDT, label:"USDT"},
        {label: "USDC", value:'USDC'},
        {value: DAI, label: "DAI"},
        {value: ETH, label: "ETH"}
    ]

    useEffect(() => {
        //injecting web3 into Metamask or any other Ethereum wallet extension
        //window.ethereum.enable();
        //let accounts = web3.eth.accounts;
        //Get current gas cost from Eth Gas Station
        /*axios.get(`https://ethgasstation.info/api/ethgasAPI.json?api-key=510e5437d0d81016ceafb6e9b96fd9998482aef4c7d337fc41c58f929d25`)
        .then(res => {
           sessionStorage.setItem('gweifast',(res.data.fast/10))
           sessionStorage.setItem('gweifastest',(res.data.fastest/10))
           sessionStorage.setItem('gweisafelow', (res.data.safeLow/10))
        })*/

    });

    //Adds liquidity to ERC20 <=> WETH pool with ETH.  Use only if adding pairs that includes ETH because ETH is not ERC20 compliant
    async function appAddLiquidityETH(e) {
        e.preventDefault();
        //need to get current balances

        /*setup values params for addLiquidityETH*/
        
        //contract address of the desired token
        let tokenAddress = selectedliquidity.value; //value = contract address
        //amout of token to add as liquidity WETH/token price is <= msg.value/amountTokenDesired(token depreciates)
        let amountTokenDesired = web3.utils.toWei('0.2','ether')
        //bounds extent to which WETH/token price can go up before the transaction revert(tollerance) <=amountTokenDesire
        let amountTokenMin = web3.utils.toWei('0.009','ether')
        //bounds extent to which token/WETH price can go up before transaction revert <=msg.value
        let amountETHMin = web3.utils.toWei('1','ether')
        //Recipient of the liquidity tokens
        let to = WALLETADDRESS;  
        let deadline = Math.floor(Date.now()/1000) + 60 * 20;
        
       //setup trade 
        let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
       const _amountIn = new BigNumber(convertedAmnt);
       console.log(`${_amountIn} :: ${tokenAddress} :: ${amountTokenDesired} :: ${amountTokenMin} :: ${amountETHMin} :: ${ethereum.selectedAddress} :: ${new BigNumber(deadline)}`) 
       const tx = [{
            gasPrice:  (sessionStorage.getItem('gweifastest')).padEnd(9,0), //'0x09184e72a000', // customizable by user during MetaMask confirmation.
            //gasLimit: (sessionStorage.getItem('gweifastest')).padEnd(9,0), // customizable by user during MetaMask confirmation.
            from: ethereum.selectedAddress, // must match user's active address.
            value: web3.utils.toHex(_amountIn), // Only required to send ether to the recipient from the initiating external account.
            data: uniswaprouter.methods.addLiquidityETH(
                                                    tokenAddress,
                                                    amountTokenDesired,
                                                    amountTokenMin,
                                                    amountETHMin,
                                                    ethereum.selectedAddress,
                                                    deadline).encodeABI()
        }];
        
        const transactionHash = await provider.send('eth_sendTransaction', tx)
        console.log('transactionHash is ' + transactionHash);
    }

    //get balance of an asset.  this is normally reflecting from Metamask
    async function getBalanceOfDAI(assetAddress) {
        let contract = await new web3.eth.Contract(balanceOfJSON, assetAddress)
        let balance = await contract.methods.balanceOf(WALLETADDRESS).call();
        console.log(`current ${balance}`)
        return balance
    }

    async function getBalanceOfUSDC(assetAddress) {
        /*let contract = await new web3.eth.Contract(balanceOfJSON, assetAddress)
        let balance = await contract.methods.balanceOf(WALLETADDRESS).call();
        console.log(`current ${balance}`)
        return balance*/
    }

    //Adds liquidity to an ERC20 <=> ERC20
    async function appAddLiquidity(e) {
        e.preventDefault();

        //contract address of the desired token
        let tokenA = USDC
        //contract address of the desired token
        let tokenB = DAI
        //amount of tokena to add as liquidity if b/a price is <= amountBdesired/amountAdesired
        let amountAdesired = web3.utils.toWei(amounttoadd,'ether')
        //amount of tokenB to add as liquidity if the A/B price is <= amountADesired/amountBDesired (B depreciates).
        let amountBdesired = web3.utils.toWei(amounttoadd,'ether')
        //Bounds the extent to which the B/A price can go up before the transaction reverts. Must be <= amountADesired
        let amountAMin = web3.utils.toWei('0.01','ether')
        //Bounds the extent to which the A/B price can go up before the transaction reverts. Must be <= amountBDesired.
        let amountBMin = web3.utils.toWei('0.01','ether')
        //recipient of liquidity tokens
        let to = WALLETADDRESS
        //timestamp after which transaction will revert
        let deadline = Math.floor(Date.now()/1000) + 60 * 20;


        let ethereum = window.ethereum;
        await ethereum.enable();
        let provider = new ethers.providers.Web3Provider(ethereum);
        let weiamount = web3.utils.toWei(amounttoadd,'ether')
        
        //console out inputs 
        console.log(`AddLP Params: ${amountAdesired} :: ${amountBdesired} :: ${amountAMin} :: ${amountBMin}`);

        // Acccounts now exposed
        const params = [{
            gasPrice:  (sessionStorage.getItem('gweisafelow')).padEnd(9,0), //'0x09184e72a000', // customizable by user during MetaMask confirmation.
            gasLimit: (sessionStorage.getItem('gweisafelow')).padEnd(9,0), // customizable by user during MetaMask confirmation.
            from: ethereum.selectedAddress, // must match user's active address.
            value: weiamount, // Only required to send ether to the recipient from the initiating external account.
            data: uniswaprouter.methods.addLiquidity(
                                            tokenA,
                                            tokenB,
                                            amountAdesired,
                                            amountBdesired,
                                            amountAMin,
                                            amountBMin,
                                            to,
                                            deadline
                                ).encodeABI()
        }];

        const transactionHash = await provider.send('eth_sendTransaction', params)
        console.log('transactionHash is ' + transactionHash);
    }

    //Get Execution Prices
    async function priceLevels(e) {
        e.preventDefault();
        //chainId must be set to 1 (mainnet) because it does not work on any testnet
        let overrideChainId = 1;
        let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
        const amountIn = new BigNumber(convertedAmnt) //0.001 ETH
        const usdt = await Fetcher.fetchTokenData(overrideChainId,DAI);
        const weth = await WETH[overrideChainId];
        const pair = await Fetcher.fetchPairData(usdt, weth);
        const route = new Route([pair], weth);
        const tokenAmount = new TokenAmount(weth, amountIn);
        const trade = new Trade(route, new TokenAmount(weth, amountIn), TradeType.EXACT_INPUT)
        let midPrice = route.midPrice.toSignificant(6);
        let executionPrice = trade.executionPrice.toSignificant(6);
        let nextMidPrice = trade.nextMidPrice.toSignificant(6);
        let invertPrice = route.midPrice.invert().toSignificant(6)
        
        //Include slippage tolerance
        setmidPrice(midPrice);
        setexecutionPrice(executionPrice);
        setnextMidPrice(nextMidPrice);
        setinvertPrice(invertPrice)
    }


    //Swap Assets
    async function appSwapExactETHForTokens(e) {
        e.preventDefault();
        //setup trade
        /*let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
        const amountIn = new BigNumber(convertedAmnt);
        
        //setup Swap data
        const slippageTolerance = new Percent('50','100000') //50 bips 1 bip = 0.050
        const amountOutMin = 10; //trade.minimumAmountOut(slippageTolerance).raw;
        const deadline = Math.floor(Date.now()/1000) + 60 * 20;*/
        
        /*
        * just need to get wallet address and private key from Metamask connected address because we are interfacing with smart contract directly and not through meta mask
        */
        /*let ethereum = window.ethereum;
        await ethereum.enable();
        let provider = new ethers.providers.Web3Provider(ethereum);
        let accounts = provider.listAccounts()
                                .then(result => console.log(result))
                                .catch(error => console.log(error))*/

        //console out inputs 
        //console.log(`Params: ${amountIn} :: ${amountOutMin} :: ${deadline}`);

        // Acccounts now exposed
        /*const params = [{
            gasPrice:  (sessionStorage.getItem('gweisafelow')).padEnd(9,0), //'0x09184e72a000', // customizable by user during MetaMask confirmation.
            gasLimit: (sessionStorage.getItem('gweisafelow')).padEnd(9,0), // customizable by user during MetaMask confirmation.
            from: ethereum.selectedAddress, // must match user's active address.
            value: web3.utils.toHex(amountIn), // Only required to send ether to the recipient from the initiating external account.
            data: anathalp.methods.appSwapExactETHForTokens(
                                                    DAI, 
                                                    amountIn, 
                                                    amountOutMin, 
                                                    deadline).encodeABI()
        }];

        const transactionHash = await provider.send('eth_sendTransaction', params)
        console.log('transactionHash is ' + transactionHash);*/
    }

    //Determine to call appAddLiquidityETH or appLiquidity
    function addLiquidity(e) {
        e.preventDefault();
        console.log(`addLiquidity`)
    }
    
    /*
    * This function determines which addLiquidity function to call
    * Either addLiquidityETH or addLiquidity.  Remember addLiquidityETH if the pair has ETH.  ETH is not ERC20 compliant
    * therefore it must be wrapped with WETH.  But if pair is ERC20 to ERC20, USDC/DAI, then addLiquidity function
    * must instead be invoked
    */
    async function _addLiquidty(e) {
        e.preventDefault();
        //console.log(`selectedliquidty :: ${selected.label} :: selectedasset ${selectedliquidity.label}`)
        if(selected.label === 'ETH' || selectedliquidity.label === 'ETH') {
            await appAddLiquidityETH(e)
        }
        else {
            await appAddLiquidity(e)
        }
    }

    //Withdraw from Liquidity
    async function withdrawFromLiquidity(e) {
        e.preventDefault();
    }

    
    function getSelectedAsset(e) {
        //must get actual address of the asset
        setselected(e)
        console.log(e.label)
    }

    function getSelectedLiquidity(e) {
        //get the actual address of the pool
        setselectedliquidity(e);
        console.log(e.label)
    }

    //future functionality
    function getSelectedNetwork(e) {
        setselectednetwork(e.value)    
    }

  return (
    
    <div className='container'>
    
    <div><NavBar /></div>
    <div>
                <Select
                    defaultValue={selectednetwork}
                    onChange={getSelectedNetwork}
                    options={networkid}
                    placeholder="Select Network"
                />
    </div>

    <Tabs>
    <TabList>
      <Tab>Pool</Tab>
      <Tab>Swap</Tab>
    </TabList>

    <TabPanel>
                    <div>From</div>
                        <div>
                                <Select
                                    defaultValue={selected}
                                    onChange={getSelectedAsset}
                                    options={options}
                                />
                        </div>
                    <div>To</div>
                    <div>
                        <div>
                                <Select
                                    defaultValue={selectedliquidity}
                                    onChange={getSelectedLiquidity}
                                    options={liquidityoptions}
                                />
                        </div>
                    </div>

                    <div>
                                <label>Enter Amount In ETH To Send</label>&nbsp;&nbsp;&nbsp;&nbsp;
                                <input type="text" className="form-control" value={amounttoadd} onChange={(e)=>{setamounttoadd(e.target.value)}} required />
                    </div>
                    <div style={{paddingTop: '25px'}}>
       
        
        <form onSubmit={(e)=>_addLiquidty(e)} style={{paddingBottom:'10px'}}>
                <button type="submit" className="btn btn-primary">Add To Liquidity</button>
        </form>
        
        <form onSubmit={(e)=>withdrawFromLiquidity(e)} style={{paddingBottom:'10px'}}>
                <button type="submit" className="btn btn-primary">Withdraw Pool</button>
        </form>
    </div>
    </TabPanel>

    <TabPanel>
                <div>From</div>
                    <div>
                            <Select
                                defaultValue={selected}
                                onChange={getSelectedAsset}
                                options={options}
                            />
                    </div>
                <div>To</div>
                <div>
                    <div>
                            <Select
                                defaultValue={selectedliquidity}
                                onChange={getSelectedLiquidity}
                                options={liquidityoptions}
                            />
                    </div>
                </div>

                <div>
                            <label>Enter Amount In ETH To Send</label>&nbsp;&nbsp;&nbsp;&nbsp;
                            <input type="text" className="form-control" value={amounttoadd} onChange={(e)=>{setamounttoadd(e.target.value)}} required />
                </div>
                <div style={{paddingTop: '25px'}}>
                    <form onSubmit={(e)=>appSwapExactETHForTokens(e)} style={{paddingBottom:'10px'}}>
                                <button type="submit" className="btn btn-primary">Swap Assets</button>
                        </form>
                        
    </div>
    </TabPanel>
    </Tabs>


    <div sytle={{paddingTop: '1000px'}}>
        <div>
                
                <label><b>Mid Price</b> ${midPrice}</label>
                <label style={{ paddingLeft: '20px'}}><b>Invert Price</b> ${invertPrice}</label>
                <label style={{ paddingLeft: '20px'}}><b>Execution Price</b> ${midPrice}</label>
                <label style={{ paddingLeft: '20px'}}><b>Next Mid Price</b> ${executionPrice}</label>
                <div>
                <form onSubmit={(e)=>priceLevels(e)}>
                    <button type="submit" className="btn btn-primary mb-5">View Price Levels</button>
                </form>
                </div>
                
        </div>
    </div>

    </div>
   
  );

  

}

export default App;
