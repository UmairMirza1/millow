import { useEffect, useState } from 'react';
import { ethers } from 'ethers';

// Components
import Navigation from './components/Navigation';
import Search from './components/Search';
import Home from './components/Home';

// ABIs
import RealEstate from './abis/RealEstate.json'
import Escrow from './abis/Escrow.json'

// Config
import config from './config.json';

function App() {
  const [provider, setProvider] = useState(null)
  const [escrow, setEscrow] = useState(null)

  const [account, setAccount] = useState(null)

  const [homes, setHomes] = useState([])
  const [home, setHome] = useState({})
  const [toggle, setToggle] = useState(false);

  const [ratings, setRatings] = useState([])
  

  const loadBlockchainData = async () => {

    const provider = new ethers.providers.Web3Provider(window.ethereum)
    setProvider(provider)
    const network = await provider.getNetwork()
    console.log(network)
    const realEstate = new ethers.Contract(config[network.chainId].realEstate.address, RealEstate, provider)
    const totalSupply = await realEstate.totalSupply()
    
   //
    const homes = []

    for (var i = 1; i <= totalSupply; i++) {
      //Total supp
      const uri = await realEstate.tokenURI(i)
      const response = await fetch(uri)
      const metadata = await response.json()
      homes.push(metadata)
      //console.log(metadata)
    }

  
    setHomes(homes)
    const escrow = new ethers.Contract(config[network.chainId].escrow.address, Escrow, provider)
    setEscrow(escrow)

    
    window.ethereum.on('accountsChanged', async () => {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = ethers.utils.getAddress(accounts[0])
      setAccount(account);
    })
  }

  const getRating= async (nftId)=> {
    try {

      const provider = new ethers.providers.Web3Provider(window.ethereum)
      setProvider(provider)
      const network = await provider.getNetwork()
      console.log(network)
      const _escrow = new ethers.Contract(config[network.chainId].escrow.address, Escrow, provider)
      //accessing the mapping on frontend 
      const rating= await _escrow.getRatings(nftId);

      return rating.toNumber()
    } catch (error) {
      console.log(error)      
    }    
   }

  useEffect(() => {
    loadBlockchainData()
  }, [])


  const togglePop = (home) => {
    setHome(home)
    toggle ? setToggle(false) : setToggle(true);
  }

  useEffect(() => {
    var fetchedRatings = []
    homes.map(async (home, index) =>  {
      const rating = await getRating(index)
      fetchedRatings.push(rating)
    })
    setRatings(fetchedRatings)
  }, [homes])


  useEffect(() => {
    console.log("Ratings: ", ratings)
    console.log(ratings.length)
  }, [ratings])

  return (
    <div>
      <Navigation account={account} setAccount={setAccount} />
      <Search />

      <div className='cards__section'>

        <h3>Homes For You</h3>

        <hr />

        <div className='cards'>

          {
            //working inside the div
          homes.map((home, index) => (
            <div className='card' key={index} onClick={() => togglePop(home)}>

              <div className='card__image'>
                
                <img src={home.image} alt="Home" />
              
              </div>
              <div className='card__info'>
                <h4>{home.attributes[0].value} ETH</h4>
                <p>
                  <strong>{home.attributes[2].value}</strong> beds |
                  <strong>{home.attributes[3].value}</strong> baths |
                  <strong>{home.attributes[4].value}</strong> sqft
                </p>
                <p><strong>Ratings: </strong>
                {
                  ratings[index] 
                }
                
                 </p>
                <p>{home.address}</p>
              </div>
            </div>
          ))
          
          
          }
        </div>

      </div>

      {toggle && (
        <Home home={home} provider={provider} account={account} escrow={escrow} togglePop={togglePop} />
      )}

    </div>
  );
}

export default App;