const CONTRACT_ADDRESS = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3";
const CHAIN_ID = 84532n;

let provider, signer, contract;
let proofs = null;
let userProof = null;
let publicPrice = 0n;

document.getElementById("contract-address").textContent = CONTRACT_ADDRESS;
document.getElementById("explorer-link").href = `https://basescan.org/address/${CONTRACT_ADDRESS}`;

document.getElementById("copy-btn").onclick = () => {
  navigator.clipboard.writeText(CONTRACT_ADDRESS);
  alert("Contract address copied!");
};

async function loadProofs() {
  if (!proofs) {
    const res = await fetch("proofs.json");
    proofs = await res.json();
  }
  return proofs;
}

async function loadPublicPrice() {
  publicPrice = await contract.publicPrice();
  document.getElementById("public-price").textContent = `Price per NFT: ${ethers.formatEther(publicPrice)} ETH`;
}

function getInjectedProvider() {
  if (window.ethereum) return window.ethereum;
  if (window.phantom?.ethereum) return window.phantom.ethereum;
  return null;
}

document.getElementById("connect-btn").onclick = async () => {
  const injected = getInjectedProvider();
  if (!injected) return alert("Install MetaMask or Phantom!");
  provider = new ethers.BrowserProvider(injected);
  await provider.send("eth_requestAccounts", []);
  signer = await provider.getSigner();
  const address = await signer.getAddress();

  const network = await provider.getNetwork();
  if (network.chainId !== CHAIN_ID) return alert("Switch to Base Sepolia");

  contract = new ethers.Contract(CONTRACT_ADDRESS, [
    "function whitelistMint(uint256, bytes32[])",
    "function whitelistSaleActive() view returns (bool)",
    "function publicMint(uint256) payable",
    "function publicSaleActive() view returns (bool)",
    "function publicPrice() view returns (uint256)"
  ], signer);

  await loadPublicPrice();
  const wlActive = await contract.whitelistSaleActive();
  const publicActive = await contract.publicSaleActive();
  const proofData = await loadProofs();
  userProof = proofData[address];

  if (wlActive && userProof) document.getElementById("whitelist-mint").classList.remove("hidden");
  if (publicActive) document.getElementById("public-mint").classList.remove("hidden");

  document.getElementById("connect-btn").classList.add("hidden");
  document.getElementById("status").textContent = `Connected: ${address.slice(0,6)}...${address.slice(-4)}`;
};

document.getElementById("mint-wl-btn").onclick = async () => {
  if (!userProof) return alert("Not whitelisted!");
  try {
    document.getElementById("status").textContent = "Minting whitelist...";
    const tx = await contract.whitelistMint(1n, userProof);
    await tx.wait();
    document.getElementById("status").textContent = "Whitelist mint successful!";
  } catch(e) {
    document.getElementById("status").textContent = e.reason || e.message;
  }
};

document.getElementById("mint-public-btn").onclick = async () => {
  const qty = BigInt(document.getElementById("public-qty").value);
  try {
    document.getElementById("status").textContent = "Minting public...";
    const tx = await contract.publicMint(qty, { value: publicPrice * qty });
    await tx.wait();
    document.getElementById("status").textContent = "Public mint successful!";
  } catch(e) {
    document.getElementById("status").textContent = e.reason || e.message;
  }
};

function createSparkles() {
  const container = document.getElementById("sparkles");
  for (let i=0; i<30; i++){
    const div = document.createElement("div");
    div.className = "sparkle";
    div.style.left = Math.random()*100 + "%";
    div.style.top = Math.random()*100 + "%";
    div.style.width = (2+Math.random()*4) + "px";
    div.style.height = (2+Math.random()*4) + "px";
    div.style.animationDuration = (2+Math.random()*2)+"s";
    div.style.animationDelay = Math.random()*3+"s";
    container.appendChild(div);
  }
}
createSparkles();
