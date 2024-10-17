require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config(); // to use environment variables like FEE and API keys
require("@nomicfoundation/hardhat-ledger");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100,
      },
      viaIR: true,
    },
  },
  networks: {
    // Default Hardhat local network for testing
    hardhat: {
      chainId: 42161,  // Standard chainId for Hardhat Network
    },

    // Testnet: Arbitrum Sepolia
    // arbitrumSepolia: {
    //   url: "https://arbitrum-sepolia.infura.io/v3/be639fbf137343ed9e7ec001a4858c16",
    //   accounts: [``],  // Use PRIVATE_KEY from .env
    // },

    arbitrumOne: {
      url: "https://arbitrum-mainnet.infura.io/v3/fbd14db5c6e54a5cb4110a7f826ddd83",
      ledgerAccounts: ["0xc59F3025DDe76f219981Ac99f4799D9cF7edcEC9"]
    }
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN_API_KEY,  // For verifying contracts on Etherscan
  // },
};
