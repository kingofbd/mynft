require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("hardhat-deploy");
require("hardhat-deploy-ethers");
require("@openzeppelin/hardhat-upgrades");
require("hardhat-contract-sizer");
require("solidity-coverage");

const INFURA_PROJECT_ID = "YOUR_INFURA_PROJECT_ID";
const PRIVATE_KEY = "YOUR_PRIVATE_KEY";
const ETHERSCAN_API_KEY = "YOUR_ETHERSCAN_API_KEY";

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    sepolia: {
      url: `https://sepolia.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
    },
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_PROJECT_ID}`,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
  },
};