// src/chains/ethereum.ts
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

export async function getEthBalance(address: string): Promise<string> {
    try {
        const balance = await provider.getBalance(address);
        // Convert from wei to ETH
        return ethers.formatEther(balance);
    } catch (err) {
        console.error("Error fetching ETH balance:", err);
        throw err;
    }
}
