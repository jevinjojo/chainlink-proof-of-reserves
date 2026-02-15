import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      timeout: 120000, // 2 minutes timeout
      gasPrice: "auto", // Let it auto-calculate
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  }
};

export default config;
