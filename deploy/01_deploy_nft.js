module.exports = async function ({ getNamedAccounts, deployments }) {
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    await deploy("MyNFT", {
        from: deployer,
        args: ["MyNFT Collection", "MNFT", "https://api.mynft.com/token/"],
        log: true,
    });
};
module.exports.tags = ["MyNFT"];