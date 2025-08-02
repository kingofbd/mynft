// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IAuction {
    function initialize(
        address _nft,
        uint256 _tokenId,
        address _paymentToken,
        address _priceFeed,
        uint256 _duration
    ) external;

    function placeBid(uint256 _amount) external payable;
    function withdraw() external;
    function endAuction() external;
    function extendAuction(uint256 additionalTime) external;
    function getPriceInUSD() external view returns (uint256);
}
