import logo from './logo.svg';
import './App.css';
import React, {useState, useEffect} from 'react'
import { Link, useHistory } from 'react-router-dom'
import Select from "react-select";
import axios from 'axios';
import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { ethers } from 'ethers'
import detectEthereumProvider from '@metamask/detect-provider';
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
import HDWalletProvider from '@truffle/hdwallet-provider';
import uniswapv2routerJSON from './UniswapV2Router.json';
import anathalpJSON from './AnathaLP.json'

function App() {

    /*
    * KOVAN and Ropsten addresses are not working.  All code examples are pointing to Mainnet which is concerning.
    */
    
    let ethereum = window.ethereum;
    console.log(`Ethereum is Connected ${ethereum.isConnected()} selected address :: ${ethereum.selectedAddress}`)
    sessionStorage.setItem('selectedaddress', ethereum.selectedAddress)
    const web3 = new Web3(Web3.currentProvider || INFURA)
    let provider = detectEthereumProvider();
    if(provider) {
        console.log(`Ethereum successfully detected`)
    }
    else {
        console.log(`Need to install Metamask`)
    }

    const uniswaprouter = new web3.eth.Contract(uniswapv2routerJSON, UNISWAPROUTER02);
    const anathalp = new web3.eth.Contract(anathalpJSON, ANATHALP)
    const chainId = NetworkChainId;
    const USDT_KOVAN = web3.utils.toChecksumAddress(USDT);
    const DAI_KOVAN = web3.utils.toChecksumAddress(DAI);
    const ETH_CONTRACT_ADDRESS = ETH;
    
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
        {label:"usdt/weth", value: USDT},
        {label:"weth/dai", value:DAI}
    ]

    const options = [
        {value:ETH, label:"Ether"}, 
    ];
    const defaultOption = options[0];

    const liquidityoptions = [
        {value: USDT, label:"USDT/WETH"},
        {value: DAI, label: "WETH/DAI"}
    ]

    useEffect(() => {
        //injecting web3 into Metamask or any other Ethereum wallet extension
        window.ethereum.enable();
        let accounts = web3.eth.accounts;
        //Get current gas cost from Eth Gas Station
        axios.get(`https://ethgasstation.info/api/ethgasAPI.json?api-key=510e5437d0d81016ceafb6e9b96fd9998482aef4c7d337fc41c58f929d25`)
        .then(res => {
           sessionStorage.setItem('gweifast',(res.data.fast/10))
           sessionStorage.setItem('gweifastest',(res.data.fastest/10))
           sessionStorage.setItem('gweisafelow', (res.data.safeLow/10))
        })

    });

    //Get Execution Prices
    async function priceLevels(e) {
        e.preventDefault();
        let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
        //console.log('priceLevel');
        const amountIn = new BigNumber(convertedAmnt) //0.001 ETH
        const usdt = await Fetcher.fetchTokenData(chainId,DAI);
        const weth = await WETH[chainId];
        const pair = await Fetcher.fetchPairData(usdt, weth);
        const route = new Route([pair], weth);
        const tokenAmount = new TokenAmount(weth, amountIn);
        //const trade = new Trade( route,  tokenAmount, TradeType.EXACT_INPUT);
        const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT)
        let midPrice = route.midPrice.toSignificant(6);
        let executionPrice = trade.executionPrice.toSignificant(6);
        let nextMidPrice = trade.nextMidPrice.toSignificant(6);
        //Include slippage tolerance

        setmidPrice(midPrice);
        setexecutionPrice(executionPrice);
        setnextMidPrice(nextMidPrice);

    }
    
    //Add to liquidity Smart Contract
    async function addLiquiditySC(e) {
        e.preventDefault();
        //const pair = createPair();

        //setup trade
        let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
        const amountIn = new BigNumber(convertedAmnt);
        
        //setup Swap data
        const slippageTolerance = new Percent('50','100000') //50 bips 1 bip = 0.050
        const amountOutMin = 10; //trade.minimumAmountOut(slippageTolerance).raw;
        const deadline = Math.floor(Date.now()/1000) + 60 * 20;
        
        /*
        * just need to get wallet address and private key from Metamask connected address because we are interfacing with smart contract directly and not through meta mask
        */
        let ethereum = window.ethereum;
        await ethereum.enable();
        let provider = new ethers.providers.Web3Provider(ethereum);
        let accounts = provider.listAccounts()
                                .then(result => console.log(result))
                                .catch(error => console.log(error))

        //console out inputs 
        console.log(`Params: ${amountIn} :: ${amountOutMin} :: ${deadline}`);

        // Acccounts now exposed
        const params = [{
            gasPrice:  (sessionStorage.getItem('gweisafelow')).padEnd(9,0), //'0x09184e72a000', // customizable by user during MetaMask confirmation.
            gasLimit: (sessionStorage.getItem('gweisafelow')).padEnd(9,0), // customizable by user during MetaMask confirmation.
            from: ethereum.selectedAddress, // must match user's active address.
            value: web3.utils.toHex(amountIn), // Only required to send ether to the recipient from the initiating external account.
            data: anathalp.methods.swapTokensForETH(
                                                    DAI, 
                                                    amountIn, 
                                                    amountOutMin, 
                                                    deadline).encodeABI()
        }];

        const transactionHash = await provider.send('eth_sendTransaction', params)
        console.log('transactionHash is ' + transactionHash);
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
        console.log(`Params: ${amountIn} :: ${amountOutMin} :: ${weiamount} :: ${deadline}`);

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
        let convertedAmnt = Web3.utils.toWei(amounttoadd,'ether');
        const amountIn = new BigNumber(convertedAmnt) //0.001 ETH
        const usdt = await Fetcher.fetchTokenData(chainId, DAI);
        const weth = await WETH[chainId];
        const pair = await Fetcher.fetchPairData(usdt, weth);
        const route = new Route([pair], weth);
        const tokenAmount = new TokenAmount(weth, amountIn);
        const trade = new Trade(route, new TokenAmount(weth, '100000000000000000'), TradeType.EXACT_INPUT)
        
        
        //setup Swap data
        const slippageTolerance = new Percent('50','10000') //50 bips 1 bip = 0.050
        const amountOutMin = trade.minimumAmountOut(slippageTolerance).raw;
        const path = [weth.address, usdt.address];
        const to = '';
        const deadline = Math.floor(Date.now()/1000) + 60 * 20;
        const inputTokenAmount = trade.inputAmount.raw;
        const outputTokenAmount = trade.outputAmount.raw

        let ethereum = window.ethereum;
        await ethereum.enable();
        let provider = new ethers.providers.Web3Provider(ethereum);
        let weiamount = web3.utils.toWei(amounttoadd,'ether')
        

        //withdraw from liquidity pool
        const params = [{
            gasPrice:  (sessionStorage.getItem('gweisafelow')).padEnd(9,0), //'0x09184e72a000', // customizable by user during MetaMask confirmation.
            gasLimit: (sessionStorage.getItem('gweifastest')).padEnd(9,0), // customizable by user during MetaMask confirmation.
            from: ethereum.selectedAddress, // must match user's active address.
            value: weiamount, // Only required to send ether to the recipient from the initiating external account.
            data: uniswaprouter.methods.removeLiquidity(
                                                        ETH,
                                                        selectedliquidity,
                                                        new BigNumber(weiamount),
                                                        new BigNumber(inputTokenAmount),
                                                        new BigNumber(outputTokenAmount),
                                                        ethereum.selectedAddress,
                                                        deadline
                                                    ) .encodeABI()
        }];

        const transactionHash = await provider.send('eth_sendTransaction', params)
        console.log('transactionHash is ' + transactionHash);
        
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
                <p>
                <form onSubmit={(e)=>priceLevels(e)} className='col-md-5 mx-auto'>
                    <p>
                        <label>Enter Amount In ETH To Send</label>&nbsp;&nbsp;&nbsp;&nbsp;
                        <input type="text" className="form-control" value={amounttoadd} onChange={(e)=>{setamounttoadd(e.target.value)}} required />
                    </p>
                    <button type="submit" className="btn btn-primary mb-5">View Price Levels</button>
                </form>

                <form onSubmit={(e)=>addLiquiditySC(e)} className='col-md-5 mx-auto'>
                    <button type="submit" className="btn btn-primary mb-5">Add To Pool</button>
                </form>

                <form onSubmit={(e)=>withdrawFromLiquidity(e)} className='col-md-5 mx-auto'>
                    <button type="submit" className="btn btn-primary mb-5">Withdraw Pool</button>
                </form>
                </p>
        </div>

        <p>
                <div>
                    <label><b>Mid Price</b> ${midPrice}</label>
                </div>
                <div>
                    <label><b>Execution Price</b> ${midPrice}</label>
                </div>    
                <div>
                    <label><b>Next Mid Price</b> ${executionPrice}</label>
                </div>
        </p>

        <div>
        <p>
                <div>
                    <label><b>ETH Gas Station Price</b></label>
                </div>
                <div>
                    <label><b>Trader ASAP</b> ${  sessionStorage.getItem('gweifastest') }</label>
                </div>
                <div>
                <label><b>Fast less than 2 minutes</b> ${  sessionStorage.getItem('gweifast') }</label>
                </div>    
                <div>
                <label><b>Standard than 5 minutes</b> ${  sessionStorage.getItem('gweisafelow') }</label>
                </div>
        </p>
        </div>

    </div>
  );
}

export default App;
