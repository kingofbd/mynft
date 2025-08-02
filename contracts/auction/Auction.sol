// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

import "../interfaces/IAuction.sol";

contract Auction is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IAuction
{
    struct Bid {
        address bidder;
        uint256 amount;
    }

    IERC721 public nft;
    uint256 public tokenId;
    address public seller;
    uint256 public startTime;
    uint256 public endTime;
    address public paymentToken;
    AggregatorV3Interface internal priceFeed;

    Bid public highestBid;
    mapping(address => uint256) public pendingReturns;

    event BidPlaced(address indexed bidder, uint256 amount);
    event AuctionEnded(address winner, uint256 amount);
    event AuctionExtended(uint256 newEndTime);

    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _nft,
        uint256 _tokenId,
        address _paymentToken,
        address _priceFeed,
        uint256 _duration
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();

        nft = IERC721(_nft);
        tokenId = _tokenId;
        seller = msg.sender;
        paymentToken = _paymentToken;
        priceFeed = AggregatorV3Interface(_priceFeed);
        startTime = block.timestamp;
        endTime = startTime + _duration;

        // 将NFT转移到拍卖合约
        nft.transferFrom(msg.sender, address(this), tokenId);
    }

    function placeBid(uint256 _amount) external payable {
        require(block.timestamp < endTime, "Auction ended");
        require(_amount > highestBid.amount, "Bid too low");

        if (paymentToken == address(0)) {
            require(msg.value == _amount, "ETH amount mismatch");
        } else {
            IERC20(paymentToken).transferFrom(
                msg.sender,
                address(this),
                _amount
            );
        }

        if (highestBid.bidder != address(0)) {
            pendingReturns[highestBid.bidder] += highestBid.amount;
        }

        highestBid = Bid(msg.sender, _amount);
        emit BidPlaced(msg.sender, _amount);
    }

    function withdraw() external {
        uint256 amount = pendingReturns[msg.sender];
        require(amount > 0, "No funds to withdraw");

        pendingReturns[msg.sender] = 0;
        if (paymentToken == address(0)) {
            payable(msg.sender).transfer(amount);
        } else {
            IERC20(paymentToken).transfer(msg.sender, amount);
        }
    }

    function endAuction() external {
        require(block.timestamp >= endTime, "Auction not ended");
        require(msg.sender == seller, "Only seller");

        if (highestBid.bidder != address(0)) {
            nft.transferFrom(address(this), highestBid.bidder, tokenId);
            if (paymentToken == address(0)) {
                payable(seller).transfer(highestBid.amount);
            } else {
                IERC20(paymentToken).transfer(seller, highestBid.amount);
            }
            emit AuctionEnded(highestBid.bidder, highestBid.amount);
        } else {
            nft.transferFrom(address(this), seller, tokenId);
        }
    }

    function extendAuction(uint256 additionalTime) external onlyOwner {
        endTime += additionalTime;
        emit AuctionExtended(endTime);
    }

    function getPriceInUSD() public view returns (uint256) {
        if (highestBid.amount == 0) return 0;

        (, int256 price, , , ) = priceFeed.latestRoundData();
        uint256 adjustedPrice = uint256(price) * 1e10; // 转换为18位小数
        return (highestBid.amount * adjustedPrice) / 1e18;
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
