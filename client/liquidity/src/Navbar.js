import React, {useState, useEffect, StyleSheet} from 'react'
import {Link} from 'react-router-dom'
import Navigatebar from 'react-bootstrap/Navbar'
import Nav from 'react-bootstrap/Nav'
import 'bootstrap/dist/css/bootstrap.min.css';
import axios from 'axios';


function Navbar() {

    function getEthGasPrices(e) {
       
            //Get current gas cost from Eth Gas Station
        axios.get(`https://ethgasstation.info/api/ethgasAPI.json?api-key=510e5437d0d81016ceafb6e9b96fd9998482aef4c7d337fc41c58f929d25`)
        .then(res => {
           sessionStorage.setItem('gweifast',(res.data.fast/10))
           sessionStorage.setItem('gweifastest',(res.data.fastest/10))
           sessionStorage.setItem('gweisafelow', (res.data.safeLow/10))
        })
    }
    useEffect(() => {
        getEthGasPrices();
    });
        
    return (
        <div>
            <p>
                <label>Live ETH Gas Station Feed</label>
                <label style={{ paddingLeft: '20px'}}><b>Standard</b> ${sessionStorage.getItem('gweisafelow')}</label>
                <label style={{ paddingLeft: '20px' }}><b>Fastest less than 2 minutes</b> ${sessionStorage.getItem('gweifast')}</label>
                <label style={{ paddingLeft: '20px' }}><b>Fast less than 5 minutes</b> ${sessionStorage.getItem('gweifastest')}</label>
                <form onSubmit={(e)=>getEthGasPrices(e)}>
                    <button type="submit" className="btn btn-primary sm-5">Refresh Gas Prices</button>
                </form>
            </p>
        </div>
    )
}

export default Navbar
