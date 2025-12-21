const hre = require("hardhat");
const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();
  const contractAddress = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3";

  const newURI = "https://gateway.pinata.cloud/ipfs/bafybeih6nlxuijq2v3olyodom55wuv5zss5w3cvnvlr6n2kltnempsoml4/hidden.json";

  const artifact = await hre.artifacts.readArtifact("MismatchedRealities");

  const nft = new ethers.Contract(contractAddress, artifact.abi, deployer);

  console.log("Updating unrevealed URI to:", newURI);

  const tx = await nft.setUnrevealedURI(newURI);
  await tx.wait();

  console.log("Unrevealed URI updated successfully");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
