module.exports = async function ({ getNamedAccounts, deployments, ethers }) {
    const { deployer } = await getNamedAccounts();
    const [owner, seller] = await ethers.getSigners();

    // 获取合约实例
    const nft = await ethers.getContract("MyNFT", deployer);
    const factory = await ethers.getContract("AuctionFactory", deployer);

    // 铸造一个 NFT
    const tokenId = 1;
    await nft.mint(seller.address, tokenId);

    // 卖家批准工厂合约转移 NFT
    await nft.connect(seller).approve(factory.address, tokenId);

    // 创建拍卖
    const paymentToken = ethers.constants.AddressZero; // 使用 ETH
    const tokenUsdPriceFeed = ethers.constants.AddressZero; // 使用 ETH/USD 价格源
    const duration = 86400; // 24 小时

    const tx = await factory.connect(seller).createAuction(
        nft.address,
        tokenId,
        paymentToken,
        tokenUsdPriceFeed,
        duration
    );

    const receipt = await tx.wait();
    const auctionCreatedEvent = receipt.events.find(e => e.event === "AuctionCreated");
    const auctionAddress = auctionCreatedEvent.args.auction;

    console.log("Auction created at:", auctionAddress);
};
module.exports.tags = ["CreateAuction"];
module.exports.dependencies = ["MyNFT", "AuctionImpl", "AuctionFactory"];