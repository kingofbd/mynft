const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AuctionFactory", function () {
    let factory;
    let nft;
    let owner;
    let seller;

    before(async function () {
        [owner, seller] = await ethers.getSigners();

        // 部署 NFT 合约
        const NFT = await ethers.getContractFactory("MyNFT");
        nft = await NFT.deploy("FactoryNFT", "FNFT", "https://factory.com/");
        await nft.deployed();

        // 部署拍卖实现合约
        const Auction = await ethers.getContractFactory("Auction");
        const auctionImpl = await Auction.deploy();
        await auctionImpl.deployed();

        // 部署工厂合约
        const Factory = await ethers.getContractFactory("AuctionFactory");
        factory = await Factory.deploy(
            auctionImpl.address,
            "0x694AA1769357215DE4FAC081bf1f309aDC325306" // Sepolia ETH/USD price feed
        );
        await factory.deployed();
    });

    it("Should create a new auction", async function () {
        const tokenId = 1;
        await nft.mint(seller.address, tokenId);
        await nft.connect(seller).approve(factory.address, tokenId);

        const tx = await factory.connect(seller).createAuction(
            nft.address,
            tokenId,
            ethers.constants.AddressZero, // ETH
            ethers.constants.AddressZero, // Use ETH price feed
            86400 // 24 hours
        );

        const receipt = await tx.wait();
        const auctionCreatedEvent = receipt.events.find(e => e.event === "AuctionCreated");
        const auctionAddress = auctionCreatedEvent.args.auction;

        expect(auctionAddress).to.not.equal(ethers.constants.AddressZero);

        // 验证拍卖已添加到用户列表
        const auctions = await factory.getAuctionsByUser(seller.address);
        expect(auctions).to.include(auctionAddress);
    });

    it("Should upgrade auction implementation", async function () {
        // 部署新的拍卖实现
        const AuctionV2 = await ethers.getContractFactory("Auction");
        const auctionImplV2 = await AuctionV2.deploy();
        await auctionImplV2.deployed();

        // 升级实现
        await factory.upgradeAuctionImplementation(auctionImplV2.address);

        // 验证升级
        expect(await factory.auctionImplementation()).to.equal(auctionImplV2.address);
    });

    it("Should create multiple auctions", async function () {
        const tokenIds = [2, 3, 4];

        for (const tokenId of tokenIds) {
            await nft.mint(seller.address, tokenId);
            await nft.connect(seller).approve(factory.address, tokenId);

            await factory.connect(seller).createAuction(
                nft.address,
                tokenId,
                ethers.constants.AddressZero,
                ethers.constants.AddressZero,
                86400
            );
        }

        const auctions = await factory.getAuctionsByUser(seller.address);
        expect(auctions.length).to.equal(tokenIds.length + 1); // +1 from previous test
    });
});