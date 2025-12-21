const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");
const fs = require("fs");
const csv = require("csv-parser");
const path = require("path");

async function main() {
  const addresses = [];

  await new Promise((resolve, reject) => {
    fs.createReadStream(path.join(__dirname, "../allowlist/addresses.csv"))
      .pipe(csv({ headers: false }))
      .on("data", (row) => {
        const addr = Object.values(row)[0]?.trim();
        if (addr && hre.ethers.isAddress(addr)) {
          addresses.push(hre.ethers.getAddress(addr));
        }
      })
      .on("end", resolve)
      .on("error", reject);
  });

  if (addresses.length === 0) {
    console.error("No valid addresses found");
    process.exit(1);
  }

  const unique = [...new Set(addresses)];
  const leaves = unique.map(addr => keccak256(addr));
  const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

  const proofs = {};

  unique.forEach(addr => {
    const leaf = keccak256(addr);
    proofs[addr] = tree.getHexProof(leaf);
  });

  fs.writeFileSync(
    path.join(__dirname, "../allowlist/proofs.json"),
    JSON.stringify(proofs, null, 2)
  );

  console.log("proofs.json generated");
  console.log("Addresses:", unique.length);
  console.log("Merkle Root:", tree.getHexRoot());
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
