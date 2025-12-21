const hre = require("hardhat");

async function main() {
  const contractAddress = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3";

  const contract = await hre.ethers.getContractAt("MismatchedRealities", contractAddress);

  console.log("Toggling whitelist sale...");
  const tx = await contract.toggleWhitelistSale();
  console.log("Transaction sent:", tx.hash);
  await tx.wait();

  console.log("Waiting 5 seconds for state to update...");
  await new Promise(resolve => setTimeout(resolve, 5000));

  const isActive = await contract.whitelistSaleActive();
  console.log(`Whitelist sale is now: ${isActive ? "ACTIVE" : "INACTIVE "}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});