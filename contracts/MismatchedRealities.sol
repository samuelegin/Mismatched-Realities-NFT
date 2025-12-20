// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title 8888 NFT Collection
 * @dev ERC721A + EIP-2981 Royalties + Merkle Whitelist (FREE) + Paid Public Mint
 */
contract MismatchedRealities is ERC721A, ERC2981, Ownable, ReentrancyGuard, Pausable {
    using Strings for uint256;

    uint256 public constant MAX_SUPPLY = 8888;
    uint256 public constant TEAM_RESERVE = 88;

    address public payoutAddress;

    bool public whitelistSaleActive;
    bool public publicSaleActive;

    uint256 public publicPrice;
    uint256 public maxPerTx = 10;
    uint256 public maxPerWalletWhitelist = 1;

    bytes32 public merkleRoot;

    string private _baseTokenURI;
    string public unrevealedURI;
    bool public revealed;

    mapping(address => uint256) public whitelistMinted;

    //EVENTS
    event PayoutAddressUpdated(address indexed newAddress);
    event RoyaltyUpdated(address indexed receiver, uint96 feeNumerator);
    event MerkleRootUpdated(bytes32 root);
    event SaleToggled(string saleType, bool active);
    event PublicPriceUpdated(uint256 price);
    event Revealed();
    event Withdrawn(uint256 amount);

    constructor(
        string memory _name,
        string memory _symbol,
        address _payoutAddress,
        string memory _unrevealedURI,
        uint96 _royaltyFeeNumerator
    ) ERC721A(_name, _symbol) Ownable(_payoutAddress) {
        require(_payoutAddress != address(0), "Zero payout");

        payoutAddress = _payoutAddress;
        unrevealedURI = _unrevealedURI;

        _setDefaultRoyalty(_payoutAddress, _royaltyFeeNumerator);

        if (TEAM_RESERVE > 0) {
            _safeMint(_payoutAddress, TEAM_RESERVE);
        }
    }

    //OWNER FUNCTIONS
    function setPayoutAddress(address _addr) external onlyOwner {
        require(_addr != address(0), "Zero address");
        payoutAddress = _addr;

        ( , uint256 royaltyAmount) = royaltyInfo(0, 10_000);
        _setDefaultRoyalty(_addr, uint96(royaltyAmount));

        emit PayoutAddressUpdated(_addr);
    }

    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        require(feeNumerator <= 1_000, "Royalty > 10%");
        _setDefaultRoyalty(receiver, feeNumerator);
        emit RoyaltyUpdated(receiver, feeNumerator);
    }

    function setPublicPrice(uint256 _price) external onlyOwner {
        require(_price > 0, "Price zero");
        publicPrice = _price;
        emit PublicPriceUpdated(_price);
    }

    function setMerkleRoot(bytes32 _root) external onlyOwner {
        merkleRoot = _root;
        emit MerkleRootUpdated(_root);
    }

    function toggleWhitelistSale() external onlyOwner {
        whitelistSaleActive = !whitelistSaleActive;
        emit SaleToggled("whitelist", whitelistSaleActive);
    }

    function togglePublicSale() external onlyOwner {
        publicSaleActive = !publicSaleActive;
        emit SaleToggled("public", publicSaleActive);
    }

    function setBaseURI(string calldata uri) external onlyOwner {
        _baseTokenURI = uri;
    }

    function setUnrevealedURI(string calldata uri) external onlyOwner {
        unrevealedURI = uri;
    }

    function reveal() external onlyOwner {
        revealed = true;
        emit Revealed();
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    //AIRDROP TO MULTIPLE ADDRESSES
    function airdrop(address[] calldata recipients, uint256[] calldata quantities) external onlyOwner {
        require(recipients.length == quantities.length, "Length mismatch");

        uint256 total;
        for (uint256 i; i < quantities.length; i++) {
            total += quantities[i];
        }

        require(totalSupply() + total <= MAX_SUPPLY, "Max supply exceeded");

        for (uint256 i; i < recipients.length; i++) {
            _safeMint(recipients[i], quantities[i]);
        }
    }

    //FREE WHITELIST MINT
    function whitelistMint(uint256 quantity, bytes32[] calldata proof)
        external
        nonReentrant
        whenNotPaused
    {
        require(whitelistSaleActive, "WL inactive");
        require(quantity > 0 && quantity <= maxPerTx, "Invalid qty");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max supply");
        require(
            whitelistMinted[msg.sender] + quantity <= maxPerWalletWhitelist,
            "WL limit"
        );

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        require(MerkleProof.verify(proof, merkleRoot, leaf), "Invalid proof");

        whitelistMinted[msg.sender] += quantity;
        _safeMint(msg.sender, quantity);
    }

    //PAID PUBLIC MINT
    function publicMint(uint256 quantity)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        require(publicSaleActive, "Public inactive");
        require(quantity > 0 && quantity <= maxPerTx, "Invalid qty");
        require(totalSupply() + quantity <= MAX_SUPPLY, "Max supply");
        require(msg.value >= publicPrice * quantity, "Insufficient ETH");

        _safeMint(msg.sender, quantity);
    }

    //WITHDRAW
    function withdraw() external onlyOwner nonReentrant {
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");

        (bool ok, ) = payable(payoutAddress).call{value: bal}("");
        require(ok, "Withdraw failed");

        emit Withdrawn(bal);
    }

    //METADATA
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_exists(tokenId), "Nonexistent");

        if (!revealed) return unrevealedURI;
        return string(abi.encodePacked(_baseURI(), tokenId.toString(), ".json"));
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721A, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    receive() external payable {}
    fallback() external payable {}
}
