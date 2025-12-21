const hre = require("hardhat");

async function main() {
  const NAME = "Mismatched Realities";
  const SYMBOL = "MMR";

  const UNREVEALED_URI = "ipfs://bafkreibuvpkhecizminz2g5o42zb7rae7d6lzlq7cdjttzmt7ioq3wccju/hidden.json";

  const ROYALTY = 10;
  const PAYOUT = "0xc8bd74ff3b46b8422ef2255186b15fbe7ccdf947";

  const NFT = await hre.ethers.getContractFactory("MismatchedRealities");

  console.log("Deploying contract...");

  const nft = await NFT.deploy(
    NAME,
    SYMBOL,
    PAYOUT,
    UNREVEALED_URI,
    ROYALTY
  );

  await nft.waitForDeployment();

  console.log("Deployed to:", await nft.getAddress());
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
