const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require("fs");
const csv = require("csv-parser");

async function main() {
  const targetAddress = "0x67093880f0Fb0b1F085b491a8611081c41060E9C";
  
  if (!ethers.isAddress(targetAddress)) {
    console.error("Invalid address");
    process.exit(1);
  }
  
  const normalizedTarget = ethers.getAddress(targetAddress);
  console.log("Generating proof for address:", normalizedTarget);
  const addresses = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream("allowlist/addresses.csv")
      .pipe(csv({ headers: false }))
      .on("data", (row) => {
        let addr;
        if (Array.isArray(row)) {
          addr = row[0].trim();
        } else {
          addr = Object.values(row)[0]?.trim();
        }
        if (addr && hre.ethers.isAddress(addr)) {
          addresses.push(hre.ethers.getAddress(addr));
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (addresses.length === 0) {
    console.error("No addresses found in allowlist/addresses.csv");
    process.exit(1);
  }

  const leaves = addresses.map(addr => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  console.log("Current Merkle Root (for reference):", root);

  const leaf = keccak256(normalizedTarget);
  const proof = tree.getHexProof(leaf);

  if (proof.length === 0) {
    console.error("Address not found in whitelist");
    process.exit(1);
  }

  console.log(JSON.stringify(proof));
}

main().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});