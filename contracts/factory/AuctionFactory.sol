// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "../auction/Auction.sol";
import "../interfaces/IAuctionFactory.sol";

contract AuctionFactory is
    Initializable,
    UUPSUpgradeable,
    OwnableUpgradeable,
    IAuctionFactory
{
    mapping(address => address[]) public userAuctions;
    address public auctionImplementation;
    address public ethUsdPriceFeed;

    event AuctionCreated(address indexed auction, address indexed seller);
    event ImplementationUpgraded(address newImplementation);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        address _auctionImplementation,
        address _ethUsdPriceFeed
    ) public initializer {
        __Ownable_init(msg.sender);
        __UUPSUpgradeable_init();
        auctionImplementation = _auctionImplementation;
        ethUsdPriceFeed = _ethUsdPriceFeed;
    }

    function createAuction(
        address _nft,
        uint256 _tokenId,
        address _paymentToken,
        address _tokenUsdPriceFeed,
        uint256 _duration
    ) external returns (address) {
        address priceFeed = _paymentToken == address(0)
            ? ethUsdPriceFeed
            : _tokenUsdPriceFeed;

        // 创建代理合约
        ERC1967Proxy proxy = new ERC1967Proxy(
            auctionImplementation,
            abi.encodeWithSelector(
                Auction.initialize.selector,
                _nft,
                _tokenId,
                _paymentToken,
                priceFeed,
                _duration
            )
        );

        // 转移所有权给拍卖创建者
        Auction auction = Auction(address(proxy));
        auction.transferOwnership(msg.sender);

        userAuctions[msg.sender].push(address(proxy));
        emit AuctionCreated(address(proxy), msg.sender);
        return address(proxy);
    }

    function upgradeAuctionImplementation(
        address _newImplementation
    ) external onlyOwner {
        auctionImplementation = _newImplementation;
        emit ImplementationUpgraded(_newImplementation);
    }

    function getAuctionsByUser(
        address user
    ) external view returns (address[] memory) {
        return userAuctions[user];
    }

    function _authorizeUpgrade(address) internal override onlyOwner {}
}
