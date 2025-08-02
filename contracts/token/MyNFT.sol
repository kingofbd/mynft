// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, Ownable {
    string private _baseTokenURI;

    constructor(
        string memory name,
        string memory symbol,
        string memory baseTokenURI
    ) ERC721(name, symbol) Ownable(msg.sender) {
        _baseTokenURI = baseTokenURI;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function mint(address to, uint256 tokenId) external onlyOwner {
        _mint(to, tokenId);
    }

    function batchMint(
        address to,
        uint256[] calldata tokenIds
    ) external onlyOwner {
        for (uint i = 0; i < tokenIds.length; i++) {
            _mint(to, tokenIds[i]);
        }
    }
}
