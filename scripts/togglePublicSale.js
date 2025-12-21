const { ethers } = require("hardhat");

async function waitForStateUpdate(contract, expectedState, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    const current = await contract.publicSaleActive();
    if (current === expectedState) return true;
    console.log(`State not updated yet (attempt ${i+1}/${maxAttempts})... waiting 3s`);
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  return false;
}

async function main() {
  const contractAddress = "0x69243Fdc5a876cd0cfb3f133671Bbe6097ABB1B3";
  const contract = await ethers.getContractAt("MismatchedRealities", contractAddress);

  const before = await contract.publicSaleActive();
  console.log(`Public sale before toggle: ${before ? "ON" : "OFF"}`);

  try {
    const tx = await contract.togglePublicSale({ gasLimit: 200000 });
    console.log(`Transaction sent: ${tx.hash}`);
    await tx.wait();
    console.log("Transaction confirmed. Waiting for state update...");

    const expected = !before;
    const updated = await waitForStateUpdate(contract, expected);

    if (updated) {
      console.log(`Toggle successful! Public sale is now: ${expected ? "ON" : "OFF"}`);
    } else {
      console.warn("State did not update after 30s. Check Basescan manually.");
    }
  } catch (error) {
    console.error("Toggle failed:", error.message);
    if (error.reason) console.error("Revert reason:", error.reason);
    if (error.data) console.error("Revert data:", error.data);
  }

  const final = await contract.publicSaleActive();
  console.log(`Final confirmed state: ${final ? "ON" : "OFF"}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });