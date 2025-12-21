const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("MismatchedRealities (Free WL, Paid Public)", function () {
  let nft, owner, addr1, addr2;

  const NAME = "Mismatched Realities";
  const SYMBOL = "MMR";

  const UNREVEALED_URI = "ipfs://hiddenCID/hidden.json";
  const REVEALED_BASE_URI = "ipfs://revealedCID/";

  const ROYALTY = 750;
  const PUBLIC_PRICE = ethers.parseEther("0.02");

  beforeEach(async () => {
    [owner, addr1, addr2] = await ethers.getSigners();

    const NFT = await ethers.getContractFactory("MismatchedRealities");
    nft = await NFT.deploy(
      NAME,
      SYMBOL,
      owner.address,
      UNREVEALED_URI,
      ROYALTY
    );

    await nft.waitForDeployment();
  });

  it("Deploys and mints team reserve", async () => {
    expect(await nft.totalSupply()).to.equal(88);
    expect(await nft.balanceOf(owner.address)).to.equal(88);
    expect(await nft.tokenURI(1)).to.equal(UNREVEALED_URI);
  });

  it("Free whitelist mint with Merkle proof (1 per wallet)", async () => {
    const whitelist = [addr1.address, addr2.address];
    const leaves = whitelist.map(a => keccak256(a));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    await nft.setMerkleRoot(tree.getRoot());
    await nft.toggleWhitelistSale();

    const proof = tree.getHexProof(keccak256(addr1.address));

    await nft.connect(addr1).whitelistMint(1, proof);

    expect(await nft.balanceOf(addr1.address)).to.equal(1);

    await expect(
      nft.connect(addr1).whitelistMint(1, proof)
    ).to.be.reverted;
  });

  it("Public mint requires payment", async () => {
    await nft.setPublicPrice(PUBLIC_PRICE);
    await nft.togglePublicSale();

    await expect(
      nft.connect(addr1).publicMint(1)
    ).to.be.reverted;

    await nft.connect(addr1).publicMint(1, { value: PUBLIC_PRICE });

    expect(await nft.balanceOf(addr1.address)).to.equal(1);
  });

  it("Reveal switches tokenURI correctly", async () => {
    await nft.setBaseURI(REVEALED_BASE_URI);
    await nft.reveal();

    expect(await nft.tokenURI(1)).to.equal(
      `${REVEALED_BASE_URI}1.json`
    );
  });

  it("Royalties work (EIP-2981)", async () => {
    const sale = ethers.parseEther("1");
    const [receiver, royalty] = await nft.royaltyInfo(1, sale);

    expect(receiver).to.equal(owner.address);
    expect(royalty).to.equal((sale * 750n) / 10000n);
  });

  it("Pause blocks minting", async () => {
    await nft.setPublicPrice(PUBLIC_PRICE);
    await nft.togglePublicSale();
    await nft.pause();

    await expect(
      nft.connect(addr1).publicMint(1, { value: PUBLIC_PRICE })
    ).to.be.revertedWithCustomError(nft, "EnforcedPause");
  });
});
