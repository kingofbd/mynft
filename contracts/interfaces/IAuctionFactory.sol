// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAuctionFactory {
    function createAuction(
        address _nft,
        uint256 _tokenId,
        address _paymentToken,
        address _tokenUsdPriceFeed,
        uint256 _duration
    ) external returns (address);

    function upgradeAuctionImplementation(address _newImplementation) external;
    function getAuctionsByUser(
        address user
    ) external view returns (address[] memory);
}
