const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3";
  const contract = await ethers.getContractAt("MismatchedRealities", contractAddress);

  const quantity = 1n;
  const price = await contract.publicPrice();
  const total = price * quantity;

  const tx = await contract.publicMint(quantity, { value: total });
  console.log(`Minted ${quantity} NFT(s) - Tx: ${tx.hash}`);

  await tx.wait();
  console.log("Mint confirmed");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });