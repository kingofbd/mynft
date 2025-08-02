const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MyNFT", function () {
    let nft;
    let owner;
    let user;

    before(async function () {
        [owner, user] = await ethers.getSigners();

        const NFT = await ethers.getContractFactory("MyNFT");
        nft = await NFT.deploy("TestNFT", "TNFT", "https://test.com/");
        await nft.deployed();
    });

    it("Should have correct name and symbol", async function () {
        expect(await nft.name()).to.equal("TestNFT");
        expect(await nft.symbol()).to.equal("TNFT");
    });

    it("Should allow owner to mint", async function () {
        await nft.mint(owner.address, 1);
        expect(await nft.ownerOf(1)).to.equal(owner.address);
    });

    it("Should prevent non-owner from minting", async function () {
        await expect(
            nft.connect(user).mint(user.address, 2)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should have correct token URI", async function () {
        expect(await nft.tokenURI(1)).to.equal("https://test.com/1");
    });

    it("Should allow batch minting", async function () {
        const tokenIds = [3, 4, 5];
        await nft.batchMint(owner.address, tokenIds);

        for (const id of tokenIds) {
            expect(await nft.ownerOf(id)).to.equal(owner.address);
        }
    });
});