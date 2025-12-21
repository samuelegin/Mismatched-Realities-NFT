const { ethers } = require("hardhat");

async function main() {
  const contractAddress = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3";

  const contract = await ethers.getContractAt(
    "MismatchedRealities",
    contractAddress
  );

  const price = ethers.parseEther("0.001");

  console.log(`Setting public price to ${ethers.formatEther(price)} ETH...`);

  const tx = await contract.setPublicPrice(price);
  console.log(`Transaction sent: ${tx.hash}`);

  await tx.wait();
  console.log("Public price set successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
