import logo from './logo.svg';
import './App.css';
import ReadFrom from './components/ReadFrom';
import Navbar from './components/Navbar';
import GetBalance from './components/GetBalance';
import erc20abi from './abi/ERC20ABI.json';
import TxList from './components/TxList';
import WriteForm from './components/WriteForm';
import React , { useState , useEffect } from 'react' ;
import { ethers } from 'ethers' ;
function App() {
  const [txs, setTxs] = useState([]);
  const [Address, setAddress] = useState(null);
  const [contractListened, setContractListened] = useState();
  const [contractInfo, setContractInfo] = useState({
    address: "-",
    tokenName: "-",
    tokenSymbol: "-",
    totalSupply: "-"
  })
  const [balanceInfo, setBalanceInfo] = useState({
    address: "-",
    balance: "-"
  })

  // Getting user ballance
  const getMyBalance = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, provider);
    const signer = await provider.getSigner();
    const signerAddress = await signer.getAddress();
    const balance = await erc20.balanceOf(signerAddress);

    setBalanceInfo({
      address: signerAddress,
      balance: String(balance)
    });
  };

  //Handling transfer tokens in dapp (Write)
  const handleTransfer = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = await provider.getSigner();
    const erc20 = new ethers.Contract(contractInfo.address, erc20abi, signer);
    await erc20.transfer(data.get("recipient"), data.get("amount"));
  }

  //Connect MetaMask to Dapp
  const connectWallet = async () => {
    //provider model vasl shodan ma be blockchain inja besh gofte az tarigh metmask(window.ethereum) vaslsham
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    // ye darkhast adres mide
    await provider.send('eth_requestAccounts', []);
    //dastresi gheyre mostaghim be privetKey
    const signer = provider.getSigner();
    // address mokahatab ro migire(emza konande)
    signer.getAddress().then((result)=>{setAddress(result)});
  }

  //Disconnect MetaMask
  const disconnectWallet = () => {
    setAddress(null);
  } 

  // Handle submit button for "read from contract" section
  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const erc20 = new ethers.Contract(data.get("addr"), erc20abi, provider);

    const tokenName = await erc20.name();
    const tokenSymbol = await erc20.symbol();
    const totalSupply = await erc20.totalSupply();

    setContractInfo({
      address: data.get("addr"),
      tokenName,
      tokenSymbol,
      totalSupply
    });

    console.log(contractInfo);
  }

  //useEffect for listening to events in smart contract and return them in TxList component :0
  useEffect(() => {
    if (contractInfo.address !== "-") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const erc20 = new ethers.Contract(
        contractInfo.address,
        erc20abi,
        provider
      );

      erc20.on("Transfer", (from, to, amount, event) => {
        console.log({ from, to, amount, event });

        setTxs((currentTxs) => [
          ...currentTxs,
          {
            txHash: event.transactionHash,
            from,
            to,
            amount: String(amount)
          }
        ]);
      });
      setContractListened(erc20);

      return () => {
        contractListened.removeAllListeners();
      };
    }
  }, [contractInfo.address]);

  return (
    <>
       <Navbar connectWallet= {connectWallet} disconnectWallet={disconnectWallet} Address={Address} setAddress={setAddress}/>

       <div className="grid grid-cols-1 gap-2 md:grid-cols-2 bg-gray-800 pt-4 pb-6">

          <div className = "p-6">
            <ReadFrom handleSubmit={handleSubmit} contractInfo={contractInfo} setContractInfo={setContractInfo}/>
            <WriteForm handleTransfer={handleTransfer} />
          </div>

          <div>
             <GetBalance getMyBalance={getMyBalance} balanceInfo={balanceInfo} setBalanceInfo={setBalanceInfo}/>        </div>
             <TxList txs={txs} setTxs={setTxs} />
          </div>
    </>
  );
}

export default App;
