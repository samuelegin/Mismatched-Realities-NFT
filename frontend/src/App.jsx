import './index.css'
import { useEffect, useState } from 'react'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { ethers } from 'ethers'

function App() {
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { data: walletClient } = useWalletClient()

  const [provider, setProvider] = useState(null)
  const [contract, setContract] = useState(null)
  const [publicPrice, setPublicPrice] = useState(0n)
  const [minted, setMinted] = useState('Loading...')
  const [userProof, setUserProof] = useState(null)
  const [wlActive, setWlActive] = useState(false)
  const [publicActive, setPublicActive] = useState(false)

  const CONTRACT_ADDRESS = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3"
  const CHAIN_ID = 84532

  useEffect(() => {
    if (!isConnected || !walletClient) return
    const init = async () => {
      if (chainId !== CHAIN_ID) {
        switchChain({ chainId: CHAIN_ID })
        return
      }
      const prov = new ethers.BrowserProvider(window.ethereum)
      setProvider(prov)
      const signer = await prov.getSigner()
      const cont = new ethers.Contract(
        CONTRACT_ADDRESS,
        [
          "function totalSupply() view returns (uint256)",
          "function whitelistMint(uint256, bytes32[])",
          "function whitelistSaleActive() view returns (bool)",
          "function publicMint(uint256) payable",
          "function publicSaleActive() view returns (bool)",
          "function publicPrice() view returns (uint256)",
        ],
        signer
      )
      setContract(cont)
      const price = await cont.publicPrice()
      setPublicPrice(price)
      const total = await cont.totalSupply()
      setMinted(total.toString())
      setWlActive(await cont.whitelistSaleActive())
      setPublicActive(await cont.publicSaleActive())
      const res = await fetch("/proofs.json")
      const data = await res.json()
      const normalized = ethers.getAddress(address)
      const proof = data[normalized.toLowerCase()]
      setUserProof(proof)
    }
    init()
  }, [isConnected, walletClient, chainId])

  const mintPublic = async () => {
    if (!contract) return alert("Contract not ready")
    const qty = BigInt(document.getElementById("public-qty").value)
    try {
      const tx = await contract.publicMint(qty, { value: publicPrice * qty })
      await tx.wait()
      alert("Public mint successful!")
    } catch (e) {
      alert(e?.reason || e?.message || "Mint failed")
    }
  }

  const mintWhitelist = async () => {
    if (!contract || !userProof) return alert("Not whitelisted!")
    try {
      const tx = await contract.whitelistMint(1n, userProof)
      await tx.wait()
      alert("Whitelist mint successful!")
    } catch (e) {
      alert(e?.reason || e?.message || "Mint failed")
    }
  }

  useEffect(() => {
    const container = document.getElementById("sparkles")
    for (let i = 0; i < 30; i++) {
      const div = document.createElement("div")
      div.className = "sparkle"
      div.style.left = Math.random() * 100 + "%"
      div.style.top = Math.random() * 100 + "%"
      div.style.width = 2 + Math.random() * 4 + "px"
      div.style.height = 2 + Math.random() * 4 + "px"
      div.style.animationDuration = 2 + Math.random() * 2 + "s"
      div.style.animationDelay = Math.random() * 3 + "s"
      container.appendChild(div)
    }
  }, [])

  return (
    <div className="container">
      <div id="sparkles"></div>
      <div className="glow glow-top"></div>
      <div className="glow glow-bottom"></div>

      <header>
        <p className="accent-text">Now Minting on Base</p>
        <h1>Mismatched Realities</h1>
        <p className="description">
          Enter a realm where mystery unfolds. Each NFT reveals a unique journey through enchanted dimensions.
        </p>
      </header>

      <div className="main-content">
        <div className="nft-card">
          <img
            src="https://gateway.pinata.cloud/ipfs/bafybeih6nlxuijq2v3olyodom55wuv5zss5w3cvnvlr6n2kltnempsoml4/hidden.png"
            alt="NFT"
          />
          <div className="nft-footer">
            <p className="collection-text">Collection</p>
            <h3>Mismatched Realities</h3>
          </div>
        </div>

        <div className="mint-section">
          <div id="mint-stats">Minted: {minted} / 8888</div>
          <div className="connect-wallet-container">
            <ConnectButton />
          </div>
          <div>
            {isConnected
              ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}`
              : "Connect wallet"}
          </div>

          {wlActive && userProof && (
            <button onClick={mintWhitelist}>Mint Free (Whitelist)</button>
          )}

          {publicActive && (
            <div className='public-mint-section'>
              <div className="public-mint-container">
                <input id="public-qty" type="number" defaultValue="1" min="1" />
                <button onClick={mintPublic}>Mint Public</button>
              </div>
              <div>Price: {ethers.formatEther(publicPrice)} ETH</div>
            </div>
          )}

          <div id="contract-info">
            <span>Contract: <code>{CONTRACT_ADDRESS}</code></span>
            <button onClick={() => navigator.clipboard.writeText(CONTRACT_ADDRESS)}>Copy</button>
            <a href={`https://basescan.org/address/${CONTRACT_ADDRESS}`} target="_blank">
              View on BaseScan
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
