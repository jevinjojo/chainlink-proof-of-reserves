import express, { Request, Response } from "express";
import dotenv from "dotenv";
import { ethers } from "ethers";
import ReserveOracleAbi from "./abi/ReserveOracle.json";
import ExchangeRegistryAbi from "./abi/ExchangeRegistry.json";
import AlertContractAbi from "./abi/AlertContract.json";
import { getEthBalance } from "./chains/ethereum";
import { verifyReserves } from "./ai/verifier";
import cors from "cors";

dotenv.config();

const app = express();
app.use(express.json());

// Load env variables
const PORT = process.env.PORT || 4000;
const SEPOLIA_RPC_URL = process.env.SEPOLIA_RPC_URL!;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

// Contract addresses from your .env
const RESERVE_ORACLE_ADDRESS = process.env.RESERVE_ORACLE_ADDRESS!;
const EXCHANGE_REGISTRY_ADDRESS = process.env.EXCHANGE_REGISTRY_ADDRESS!;
const ALERT_CONTRACT_ADDRESS = process.env.ALERT_CONTRACT_ADDRESS!;

// Setup provider + wallet
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract instances
const reserveOracle = new ethers.Contract(
    RESERVE_ORACLE_ADDRESS,
    ReserveOracleAbi.abi,
    wallet
);

const exchangeRegistry = new ethers.Contract(
    EXCHANGE_REGISTRY_ADDRESS,
    ExchangeRegistryAbi.abi,
    wallet
);

const alertContract = new ethers.Contract(
    ALERT_CONTRACT_ADDRESS,
    AlertContractAbi.abi,
    wallet
);

let currentNonce: number | null = null;
let nonceLock = false;

async function getNonce(): Promise<number> {

    // Wait if another transaction is in progress
    while (nonceLock) {
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    nonceLock = true;
    // Always fetch fresh from chain — never use cached value
    const nonce = await provider.getTransactionCount(wallet.address, "latest");
    return nonce;
}

function releaseNonce() {
    nonceLock = false;
}

app.use(cors());

// Routes
app.get("/", (req: Request, res: Response) => {
    res.send("Proof of Reserves Backend is running 🚀");
});

// Get reserve status
app.get("/reserve/:exchangeId", async (req: Request, res: Response) => {
    try {
        const exchangeId = parseInt(req.params.exchangeId as string);
        const status = await reserveOracle["getReserveStatus"](exchangeId);
        res.json({
            verified: status.verified,
            discrepancyPct: status.discrepancyPct.toString(),
            timestamp: status.timestamp.toString(),
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error fetching reserve status");
    }
});

app.get("/check/ethereum/:wallet/:claimed", async (req, res) => {
    try {
        const wallet = req.params.wallet;
        const claimed = parseFloat(req.params.claimed);

        if (isNaN(claimed)) {
            return res.status(400).json({
                error: "Invalid claimed value. Must be a number.",
                wallet,
                claimed: null,
                actualBalance: null,
                verified: false,
                discrepancyPct: null,
            });
        }


        const actualBalance = parseFloat(await getEthBalance(wallet));
        const result = verifyReserves(claimed, actualBalance);

        res.json({ wallet, claimed, actualBalance, ...result });
    } catch (err) {
        res.status(500).send("Error verifying Ethereum reserves");
    }
});


// Update reserve status (mock demo)
app.post("/reserve/:exchangeId/update", async (req: Request, res: Response) => {
    try {
        const { verified, discrepancyPct } = req.body;
        const exchangeId = parseInt(req.params.exchangeId as string);
        const nonce = await getNonce();
        const tx = await reserveOracle["updateReserveStatus"](
            exchangeId,
            verified,
            discrepancyPct,
            Math.floor(Date.now() / 1000),
            { nonce, gasLimit: 100000, maxFeePerGas: ethers.parseUnits("50", "gwei"), maxPriorityFeePerGas: ethers.parseUnits("5", "gwei") }

        );
        await tx.wait();
        releaseNonce();
        res.json({ txHash: tx.hash });
    } catch (err) {
        releaseNonce();
        console.error(err);
        res.status(500).send("Error updating reserve status");
    }
});

// Trigger alert
app.post("/alert/:exchangeId", async (req: Request, res: Response) => {
    try {
        const { issue } = req.body;
        const exchangeId = parseInt(req.params.exchangeId as string);
        const nonce = await getNonce();
        const tx = await alertContract["triggerAlert"](exchangeId, issue, { nonce, gasLimit: 100000, maxFeePerGas: ethers.parseUnits("50", "gwei"), maxPriorityFeePerGas: ethers.parseUnits("5", "gwei") });
        await tx.wait();
        releaseNonce();
        res.json({ txHash: tx.hash });
    } catch (err) {
        releaseNonce();
        console.error(err);
        res.status(500).send("Error triggering alert");
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
});