const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require("fs");
const csv = require("csv-parser");

async function main() {
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

        if (addr && ethers.isAddress(addr)) {
          addresses.push(ethers.getAddress(addr));
        } else if (addr) {
          console.warn(`Invalid or skipped address: ${addr}`);
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (addresses.length === 0) {
    console.error("No valid addresses found in addresses.csv");
    return;
  }

  const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))].map(a => ethers.getAddress(a));
  console.log(`Loaded ${uniqueAddresses.length} unique valid addresses`);

  const leaves = uniqueAddresses.map(addr => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
  const root = tree.getHexRoot();

  console.log("Computed Merkle Root:", root);


  const contractAddress = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3";

  const contract = await ethers.getContractAt("MismatchedRealities", contractAddress);

  const tx = await contract.setMerkleRoot(root);
  console.log("Transaction sent:", tx.hash);
  await tx.wait();
  console.log("Merkle root successfully set with correct hashing");
}

main().catch((error) => {
  console.error("Script failed:", error);
  process.exitCode = 1;
});