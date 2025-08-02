const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Auction", function () {
    let auction;
    let nft;
    let mockPriceFeed;
    let owner;
    let seller;
    let bidder1;
    let bidder2;

    const tokenId = 1;
    const auctionDuration = 3600; // 1 hour

    before(async function () {
        [owner, seller, bidder1, bidder2] = await ethers.getSigners();

        // 部署 NFT 合约
        const NFT = await ethers.getContractFactory("MyNFT");
        nft = await NFT.deploy("AuctionNFT", "ANFT", "https://auction.com/");
        await nft.deployed();

        // 部署模拟预言机
        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        mockPriceFeed = await MockPriceFeed.deploy(2000 * 10 ** 8); // $2000
        await mockPriceFeed.deployed();

        // 部署拍卖实现合约
        const Auction = await ethers.getContractFactory("Auction");
        const auctionImpl = await Auction.deploy();
        await auctionImpl.deployed();

        // 创建代理合约
        const ERC1967Proxy = await ethers.getContractFactory("ERC1967Proxy");
        const proxy = await ERC1967Proxy.deploy(
            auctionImpl.address,
            auctionImpl.interface.encodeFunctionData("initialize", [
                nft.address,
                tokenId,
                ethers.constants.AddressZero, // ETH
                mockPriceFeed.address, // 使用模拟预言机
                auctionDuration
            ])
        );
        await proxy.deployed();

        auction = await ethers.getContractAt("Auction", proxy.address);

        // 铸造 NFT 并转移到拍卖合约
        await nft.mint(seller.address, tokenId);
        await nft.connect(seller).approve(auction.address, tokenId);
    });

    it("Should initialize correctly", async function () {
        expect(await auction.nft()).to.equal(nft.address);
        expect(await auction.tokenId()).to.equal(tokenId);
        expect(await auction.seller()).to.equal(seller.address);
        expect(await auction.paymentToken()).to.equal(ethers.constants.AddressZero);
    });

    it("Should accept bids", async function () {
        const bidAmount = ethers.utils.parseEther("0.1");

        // 第一个出价
        await auction.connect(bidder1).placeBid(bidAmount, { value: bidAmount });
        const highestBid = await auction.highestBid();
        expect(highestBid.bidder).to.equal(bidder1.address);
        expect(highestBid.amount).to.equal(bidAmount);

        // 第二个出价（更高）
        const higherBid = ethers.utils.parseEther("0.2");
        await auction.connect(bidder2).placeBid(higherBid, { value: higherBid });
        const newHighestBid = await auction.highestBid();
        expect(newHighestBid.bidder).to.equal(bidder2.address);
        expect(newHighestBid.amount).to.equal(higherBid);
    });

    it("Should allow previous bidder to withdraw", async function () {
        const initialBalance = await ethers.provider.getBalance(bidder1.address);

        // 出价者1提取退款
        await auction.connect(bidder1).withdraw();

        const finalBalance = await ethers.provider.getBalance(bidder1.address);
        expect(finalBalance).to.be.above(initialBalance);
    });

    it("Should end auction and transfer NFT", async function () {
        // 增加时间以结束拍卖
        await ethers.provider.send("evm_increaseTime", [auctionDuration + 1]);
        await ethers.provider.send("evm_mine");

        // 结束拍卖
        await auction.connect(seller).endAuction();

        // 验证 NFT 已转移
        expect(await nft.ownerOf(tokenId)).to.equal(bidder2.address);
    });

    it("Should convert price to USD", async function () {
        // 设置新价格 $2500
        await mockPriceFeed.setPrice(2500 * 10 ** 8);

        // 计算 USD 价格
        const usdPrice = await auction.getPriceInUSD();
        const expectedUsdPrice = ethers.utils.parseUnits("2500", 18);

        // 允许 1% 的误差
        const tolerance = expectedUsdPrice.div(100);
        expect(usdPrice).to.be.closeTo(expectedUsdPrice, tolerance);
    });
});