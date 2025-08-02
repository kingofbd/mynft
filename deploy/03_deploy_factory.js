module.exports = async function ({ getNamedAccounts, deployments, ethers }) {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // 获取拍卖实现地址
    const auctionImpl = await ethers.getContract("Auction", deployer);

    // Chainlink 价格源地址（Sepolia 测试网）
    const ETH_USD_PRICE_FEED = "0x694AA1769357215DE4FAC081bf1f309aDC325306";

    // 部署工厂合约
    const factory = await deploy("AuctionFactory", {
        from: deployer,
        args: [auctionImpl.address, ETH_USD_PRICE_FEED],
        log: true,
    });

    console.log("Factory deployed to:", factory.address);
};
module.exports.tags = ["AuctionFactory"];