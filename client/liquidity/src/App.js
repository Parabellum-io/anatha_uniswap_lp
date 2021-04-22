import './App.css';
import logo from './logo.svg';
import React, {useState, useEffect} from 'react'
import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';
import { Link, useHistory } from 'react-router-dom'
import 'react-tabs/style/react-tabs.css';
import Select from "react-select";
import axios from 'axios';
import BigNumber from 'bignumber.js';
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
    ETH,
    UNISWAPROUTER02,
    ANATHALP,
    NetworkChainId
} from './environment'

//Uniswap libraries
import { ChainId, Token, TokenAmount, Pair, Route, Fetcher, WETH, Percent, Trade, TradeType } from '@uniswap/sdk'
import uniswapv2routerJSON from './UniswapV2Router.json';
import anathalpJSON from './AnathaLP.json'

function App() {

    /*
        * just need to get wallet address and private key from Metamask connected address because we are interfacing with smart contract directly and not through meta mask
        */
    let ethereum = window.ethereum;
    ethereum.enable();
    let provider = new ethers.providers.Web3Provider(ethereum);
    let signer = new ethers.Wallet(PRIVATEKEY);
    let account = signer.connect(provider);
    const anathalp = new ethers.Contract(
        ANATHALP,
        ['function appAddLiquidityETH(address token,uint amountTokenDesired,uint amountTokenMin,uint amountETHMin,address to,uint deadline) external payable returns (uint amountToken, uint amountETH, uint liquidity)'],
        account
        )
    sessionStorage.setItem('selectedaddress', ethereum.selectedAddress)
    const web3 = new Web3(Web3.currentProvider || INFURA)
    let ethereumprovider = detectEthereumProvider();
    if(ethereumprovider) {
        console.log(`Ethereum successfully detected`)
    }
    else {
        console.log(`Unable to deteect Ethereum.  Need to install to use Metamask`)
    }

    const uniswaprouter = new web3.eth.Contract(uniswapv2routerJSON, UNISWAPROUTER02);
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
        {value:ETH, label:"Ether"}
    ];
    const defaultOption = options[0];

    const liquidityoptions = [
        {value: USDT, label:"USDT"},
        {value: DAI, label: "DAI"},
        {value: ETH, label: "ETH"}
    ]

    useEffect(() => {
        //injecting web3 into Metamask or any other Ethereum wallet extension
        //window.ethereum.enable();
        //let accounts = web3.eth.accounts;
        //Get current gas cost from Eth Gas Station
        axios.get(`https://ethgasstation.info/api/ethgasAPI.json?api-key=510e5437d0d81016ceafb6e9b96fd9998482aef4c7d337fc41c58f929d25`)
        .then(res => {
           sessionStorage.setItem('gweifast',(res.data.fast/10))
           sessionStorage.setItem('gweifastest',(res.data.fastest/10))
           sessionStorage.setItem('gweisafelow', (res.data.safeLow/10))
        })

    });

    //Adds liquidity to ERC20 <=> WETH pool with ETH
    async function appAddLiquidityETH(e) {
        e.preventDefault();
        /*setup values params for addLiquidityETH*/

        //contract address of the desired token
        let tokenAddress = selectedliquidity; 
        //amout of token to add as liquidity WETH/token price is <= msg.value/amountTokenDesired(token depreciates)
        let _amountTokenDesired = Web3.utils.toWei('117','ether');  //amount of DAI I want to give
        let amountTokenDesired = new BigNumber(_amountTokenDesired);
        //bounds extent to which WETH/token price can go up before the transaction revert(tollerance) <=amountTokenDesire
        let _amountTokenMin = Web3.utils.toWei('12','ether') //<= amount as amountTokenDesired (range)
        let amountTokenMin = new BigNumber(_amountTokenMin); 
        //bounds extent to which token/WETH price can go up before transaction revert <=msg.value
        let _amountETHMin = Web3.utils.toWei('0.01', 'ether') 
        let amountETHMin = new BigNumber(_amountETHMin); 
        //Recipient of the liquidity tokens
        let to = WALLETADDRESS;  
        let deadline = Math.floor(Date.now()/1000) + 60 * 20;
        
       //setup trade 
        let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
       const _amountIn = new BigNumber(convertedAmnt);
       console.log(`${_amountIn} :: ${tokenAddress} :: ${amountTokenDesired} :: ${amountTokenMin} :: ${amountETHMin} :: ${ethereum.selectedAddress} :: ${new BigNumber(deadline)}`) 
       const tx = await anathalp.appAddLiquidityETH(
            tokenAddress,
            amountTokenDesired,
            amountTokenMin,
            amountETHMin,
            ethereum.selectedAddress,
            deadline,
            {value: _amountIn, gasPrice: (sessionStorage.getItem('gweisafelow')).padEnd(9,0), gasLimit: (sessionStorage.getItem('gweisafelow')).padEnd(9,0) }
            )
        
       /*const params = [{
            gasPrice:  (sessionStorage.getItem('gweisafelow')).padEnd(9,0), //'0x09184e72a000', // customizable by user during MetaMask confirmation.
            gasLimit: (sessionStorage.getItem('gweisafelow')).padEnd(9,0), // customizable by user during MetaMask confirmation.
            from: ethereum.selectedAddress, // must match user's active address.
            value: web3.utils.toHex(_amountIn), // Only required to send ether to the recipient from the initiating external account.
            data: anathalp.methods.appAddLiquidityETH(
                                                    tokenAddress,
                                                    amountTokenDesired,
                                                    amountTokenMin,
                                                    amountETHMin,
                                                    ethereum.selectedAddress,
                                                    deadline).encodeABI()
        }];*/

        //let receipt = await tx.wait();
        //console.log(`Transaction block ${receipt.blockNumber}`)
        const transactionHash = await provider.send('eth_sendTransaction', tx)
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
    
    //Adds liquidity to an ERC20 <=> ERC20
    async function appAddLiquidity(e) {
        e.preventDefault();
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

    //Add to liquidity
    async function addLiquidity(e) {
        e.preventDefault();

        //must create two different instances of Token?
        const tka = new Token(ChainId, DAI,18)
        const tkb = new Token(ChainId, ETH,18) 
        const newpair = new Pair( new TokenAmount(tka,'100000000000000000'), new TokenAmount(tkb, '100000000000000000') )

        let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
        //console.log('priceLevel');
        const amountIn = new BigNumber(convertedAmnt) //0.001 ETH
        const usdt = await Fetcher.fetchTokenData(chainId, DAI);
        const weth = await WETH[chainId];
        const pair = await Fetcher.fetchPairData(usdt, weth);
        const route = new Route([pair], weth);
        //const route = new Route(newpair, tka)
        const tokenAmount = new TokenAmount(weth, amountIn);
        const trade = new Trade(route, new TokenAmount(weth, amountIn,18), TradeType.EXACT_INPUT)
        
        
        //setup Swap data
        const slippageTolerance = new Percent('50','100000') //50 bips 1 bip = 0.050
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
        const path = [weth.address, usdt.address]; //now we can interact with this pair
        const to = '';
        const deadline = Math.floor(Date.now()/1000) + 60 * 20;
        const inputTokenAmount = trade.inputAmount.raw; //HOW MUCH ETH WE ARE WILLING TO SEND
        const outputTokenAmount = trade.outputAmount.raw //

        let ethereum = window.ethereum;
        await ethereum.enable();
        let provider = new ethers.providers.Web3Provider(ethereum);
        let weiamount = web3.utils.toWei(amounttoadd,'ether')
        
        //console out inputs 
        //console.log(`Params: ${amountIn} :: ${amountOutMin} :: ${weiamount} :: ${deadline}`);

        // Acccounts now exposed
        const params = [{
            gasPrice:  (sessionStorage.getItem('gweisafelow')).padEnd(9,0), //'0x09184e72a000', // customizable by user during MetaMask confirmation.
            gasLimit: (sessionStorage.getItem('gweisafelow')).padEnd(9,0), // customizable by user during MetaMask confirmation.
            from: ethereum.selectedAddress, // must match user's active address.
            value: web3.utils.toHex(outputTokenAmount), // Only required to send ether to the recipient from the initiating external account.
            data: uniswaprouter.methods.swapExactETHForTokens(
                                            new BigNumber(amountOutMin), 
                                            path,
                                            USDT,
                                            deadline
                                ).encodeABI()
        }];

        const transactionHash = await provider.send('eth_sendTransaction', params)
        console.log('transactionHash is ' + transactionHash);
        
    }
    
    //Withdraw from Liquidity
    async function withdrawFromLiquidity(e) {
        e.preventDefault();
    }

    
    function getSelectedAsset(e) {
        //must get actual address of the asset
        setselected(e.value)
    }

    function getSelectedLiquidity(e) {
        //get the actual address of the pool
        setselectedliquidity(e.value);
    }

    //future functionality
    function getSelectedNetwork(e) {
        setselectednetwork(e.value)    
    }

  return (
    <div className='container'>
        <div><NavBar /></div>
        <div>Select Network Environment</div>
            <div>
                    <Select
                        defaultValue={selectednetwork}
                        onChange={getSelectedNetwork}
                        options={networkid}
                    />
            </div>  

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

        <div style={{paddingTop: '25px'}}>
            <form onSubmit={(e)=>appSwapExactETHForTokens(e)} style={{paddingBottom:'10px'}}>
                    <button type="submit" className="btn btn-primary">Swap Assets</button>
            </form>
            
            <form onSubmit={(e)=>appAddLiquidityETH(e)} style={{paddingBottom:'10px'}}>
                    <button type="submit" className="btn btn-primary">Add To Liquidity</button>
            </form>
            
            <form onSubmit={(e)=>withdrawFromLiquidity(e)} style={{paddingBottom:'10px'}}>
                    <button type="submit" className="btn btn-primary">Withdraw Pool</button>
            </form>
        </div>

    </div>
   
  );

  

}

export default App;
