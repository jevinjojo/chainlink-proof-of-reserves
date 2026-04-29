# 🔍 Proof of Reserves Verifier

> **Automated, real-time proof of reserves verification using live on-chain data and Chainlink CRE automation.**

[![Sepolia Testnet](https://img.shields.io/badge/Network-Sepolia%20Testnet-blue)](https://sepolia.etherscan.io)
[![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE%20Automation-375BD2)](https://cre.chain.link) 
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**🌐 Live Demo:** [https://chainlink-proof-of-reserves.onrender.com](https://chainlink-proof-of-reserves.onrender.com)

---

## Quick Start!

1. **Visit the live demo:** [https://chainlink-proof-of-reserves.onrender.com](https://chainlink-proof-of-reserves.onrender.com)
2. **Connect MetaMask** (Sepolia Testnet)
3. **View real-time verification** for demo exchanges
4. **See your own wallet** verified against on-chain data

---

## The Problem

After FTX collapsed and wiped out billions in customer funds, it became clear that centralized exchanges could publish **fake reserve numbers** with zero consequences. Most existing "Proof of Reserves" solutions are fundamentally broken:

- **Snapshot-based** — not real-time
- **Reliant on third-party auditors** with zero on-chain transparency
- **No automated alerting** when reserves fall below claimed amounts
- **Users have no way to independently verify** anything

---
## Solves

A **fully automated reserve verification pipeline** that:

1. Fetches claimed reserves from exchange configurations
2. Pulls actual on-chain ETH balances live from Sepolia
3. Runs a discrepancy check — flags anything diverging by more than **5%**
4. Writes the result to a `ReserveOracle` smart contract on-chain
5. Fires an `AlertContract` event when a mismatch is detected
6. Runs automatically on a **30-second cron schedule** via Chainlink CRE

---

## 🏗️ Architecture

```
Chainlink CRE (Cron Trigger every 30s)
       ↓
Backend API (Express + TypeScript)
       ↓
Ethereum Balance Fetch (Sepolia via ethers.js v6)
       ↓
Discrepancy Verifier (5% threshold calculation)
       ↓
ReserveOracle.sol (stores verified result on-chain)
       ↓
AlertContract.sol (fires alert event if mismatch)
       ↓
Frontend Dashboard (Next.js 14) + MetaMask
```

---

## 🔗 Live Deployment

### Production URLs

| Service | URL |
|---------|-----|
| **Frontend Dashboard** | [https://chainlink-proof-of-reserves.onrender.com](https://chainlink-proof-of-reserves.onrender.com) |
| **Backend API** | [https://proof-of-reserves-backend-new.onrender.com](https://proof-of-reserves-backend-new.onrender.com) |
| **GitHub Repository** | [https://github.com/jevinjojo/chainlink-proof-of-reserves](https://github.com/jevinjojo/chainlink-proof-of-reserves) |

### Smart Contracts (Sepolia Testnet)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| `ReserveOracle` | `0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc` | [View ↗](https://sepolia.etherscan.io/address/0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc) |
| `ExchangeRegistry` | `0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c` | [View ↗](https://sepolia.etherscan.io/address/0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c) |
| `AlertContract` | `0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b` | [View ↗](https://sepolia.etherscan.io/address/0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b) |

Real `updateReserveStatus` and `triggerAlert` transactions fire automatically. Decoding the input data on alert transactions shows the exact discrepancy message (e.g. `"Reserve mismatch: 99.95% discrepancy detected"`).

---

## 📁 Project Structure

```
proof-of-reserves/
│
├── contracts/                          # Solidity smart contracts (Hardhat)
│   ├── contracts/
│   │   ├── ReserveOracle.sol           # Stores verification results on-chain
│   │   ├── ExchangeRegistry.sol        # Maps exchange IDs to wallet addresses
│   │   └── AlertContract.sol           # Emits on-chain alert events on mismatch
│   ├── scripts/
│   │   └── deploy.ts                   # Hardhat deployment script
│   └── hardhat.config.ts
│
├── cre-workflows/                      # Chainlink CRE automation
│   └── proof-of-reserves/
│       └── reserve-check/
│           ├── main.ts                 # CRE workflow — cron trigger + verification logic
│           ├── workflow.yaml           # Staging + production workflow definitions
│           ├── config.staging.json     # Staging config (every 30s)
│           └── config.production.json  # Production config (hourly)
│
├── backend/                            # Node.js + Express + TypeScript
│   └── src/
│       ├── index.ts                    # API routes + contract interaction
│       ├── verifier/
│       │   └── verifier.ts             # Discrepancy calculation logic
│       ├── chains/
│       │   └── ethereum.ts             # Live ETH balance fetcher (Sepolia)
│       └── abi/                        # Contract ABIs
│
└── frontend/                           # Next.js 14 dashboard
    └── src/
        ├── app/
        │   └── page.tsx                # Main dashboard page
        ├── components/
        │   ├── ExchangeCard.tsx         # Per-exchange verification card
        │   ├── VerificationBadge.tsx    # Verified / Mismatch badge
        │   └── WalletConnectButton.tsx  # MetaMask connect/disconnect
        └── hooks/
            ├── useReserve.ts            # Verification + on-chain write logic
            └── useWallet.ts             # MetaMask wallet state
```

---

## ⚙️ How It Works

### Verification Logic

The discrepancy check is intentionally simple and auditable:

```typescript
const discrepancyPct = (Math.abs(claimed - actual) / claimed) * 100;
const verified = discrepancyPct < 5;
```

| Discrepancy | Status |
|-------------|--------|
| < 5% | ✅ Verified |
| 5% – 10% | ⚠️ Warning |
| > 10% | ❌ Mismatch |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Health check |
| `GET` | `/check/ethereum/:wallet/:claimed` | Fetch live balance + verify |
| `GET` | `/reserve/:exchangeId` | Read stored result from ReserveOracle |
| `POST` | `/reserve/:exchangeId/update` | Write verification result on-chain |
| `POST` | `/alert/:exchangeId` | Trigger AlertContract on-chain |

### Chainlink CRE Workflow

The CRE workflow runs on a cron schedule (`*/30 * * * * *` for staging):

```typescript
// Simplified workflow logic from main.ts
const doVerification = (runtime: Runtime<Config>): string => {
  runtime.log(`Starting Proof of Reserves check for wallet: ${runtime.config.wallet}`)
  runtime.log(`Claimed reserves: ${runtime.config.claimed} ETH`)

  const httpCapability = new HTTPClient()
  const response = httpCapability
    .sendRequest(runtime, { 
      method: 'GET', 
      url: `${backendUrl}/check/ethereum/${wallet}/${claimed}` 
    })
    .result()

  const result = JSON.parse(responseText)

  runtime.log(`Actual Balance: ${result.actualBalance} ETH`)
  runtime.log(`Verified: ${result.verified}`)
  runtime.log(`Discrepancy: ${result.discrepancyPct.toFixed(2)}%`)

  if (!result.verified) {
    runtime.log(`⚠️ ALERT: Reserve mismatch detected!`)
  }

  return JSON.stringify({ verified: result.verified, discrepancyPct: result.discrepancyPct })
}
```

**Real simulation output:**
```
[USER LOG] Running Proof of Reserves CronTrigger
[USER LOG] Starting Proof of Reserves check for wallet: 0x818E...
[USER LOG] Claimed reserves: 100.5 ETH
[USER LOG] Actual Balance: 0.2124 ETH
[USER LOG] Verified: false
[USER LOG] Discrepancy: 99.79%
[USER LOG] ⚠️ ALERT: Reserve mismatch detected! Discrepancy: 99.79%
```

**Note:** CRE is currently in early access. Access has been requested at [https://cre.chain.link/request-access](https://cre.chain.link/request-access). The workflow code is production-ready and works end-to-end in simulation.

---

## 🖥️ Demo Walkthrough

The demo uses fixed exchange wallets to illustrate both verification outcomes:

### Demo Configuration

For the live demo, the frontend is configured with:

```typescript
// Binance - Shows VERIFIED ✅
<ExchangeCard
  exchangeName="Binance (Demo)"
  wallet="0x818E9F62846fCC335a4090BAB9458748f34d5F28"
  claimed={0.22}  // Close to actual balance
  exchangeId={1}
/>

// Coinbase - Shows MISMATCH ❌
<ExchangeCard
  exchangeName="Coinbase (Demo)"
  wallet="0x818E9F62846fCC335a4090BAB9458748f34d5F28"  // Same wallet!
  claimed={100.5}  // Massive discrepancy
  exchangeId={2}
/>

// Your Wallet - Dynamic verification
{connectedWallet && (
  <ExchangeCard
    exchangeName="Your Wallet"
    wallet={connectedWallet}  // Your connected MetaMask address
    claimed={0.19}
    exchangeId={3}
  />
)}
```

**Key Point:** Both demo exchanges use the **same wallet address** (`0x818E...5F28`) — the difference is the **claimed reserve amount**. This demonstrates how the system detects both legitimate reserves (Binance) and fraudulent claims (Coinbase).

### Live Demo Results

| Exchange | Wallet | Claimed | Actual | Discrepancy | Status |
|----------|--------|---------|--------|-------------|--------|
| Binance (Demo) | `0x818E...5F28` | 0.22 ETH | ~0.21 ETH | ~2.6% | ✅ Verified |
| Coinbase (Demo) | `0x818E...5F28` | 100.5 ETH | ~0.21 ETH | ~99.8% | ❌ Mismatch |
| Your Wallet | Your address | 0.19 ETH | Real balance | Live | Dynamic |

**To test it:**

1. Open the [live dashboard](https://chainlink-proof-of-reserves.onrender.com)
2. Binance shows verified ✅, Coinbase shows mismatch ❌
3. Connect MetaMask → your wallet gets added as a live check
4. Scroll to "On-Chain Stored" → see results written to ReserveOracle
5. Check [Sepolia Etherscan](https://sepolia.etherscan.io/address/0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b) → find `triggerAlert` transactions and decode the input to see exact discrepancy messages

**Note:** The demo wallet address and claimed reserves are simulated for demonstration purposes. The verification logic, on-chain writes, and discrepancy calculations run against **real Sepolia data**..

---

## 🛠️ Local Development Setup

Want to run it locally or modify the code? Follow these steps:

### Prerequisites

- Node.js 18+
- MetaMask browser extension with Sepolia testnet ETH
- ngrok (optional, for exposing backend to CRE)

### 1. Clone the Repository

```bash
git clone https://github.com/jevinjojo/chainlink-proof-of-reserves.git
cd chainlink-proof-of-reserves
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env   # Fill in your keys
npm run dev
```

**Backend `.env` configuration:**

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key_here
RESERVE_ORACLE_ADDRESS=0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc
EXCHANGE_REGISTRY_ADDRESS=0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c
ALERT_CONTRACT_ADDRESS=0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b
PORT=3000
```

Backend runs on `http://localhost:3000`

### 3. Expose Backend (Optional - for CRE testing)

If you want to test the Chainlink CRE workflow locally:

```bash
ngrok http 3000
# Copy the https URL (e.g., https://abc123.ngrok-free.app)
# Use this URL in frontend .env.local and CRE config files
```

### 4. Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env.local
```

**Frontend `.env.local` configuration:**

For **local backend**:
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
```

For **ngrok-exposed backend**:
```env
NEXT_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok-free.app
```

For **deployed backend**:
```env
NEXT_PUBLIC_BACKEND_URL=https://proof-of-reserves-backend-new.onrender.com
```

**Start the frontend:**

```bash
npm run dev
# Runs on http://localhost:3001
```

### 5. Run CRE Workflow Simulation

```bash
cd cre-workflows/proof-of-reserves
cre login
cre workflow simulate reserve-check
# Select option 1 (cron-trigger)
```

**Expected output:**
```
[USER LOG] Running Proof of Reserves CronTrigger
[USER LOG] Starting Proof of Reserves check for wallet: 0x818E...
[USER LOG] Claimed reserves: 100.5 ETH
[USER LOG] Actual Balance: 0.2124 ETH
[USER LOG] Verified: false
[USER LOG] Discrepancy: 99.79%
[USER LOG] ⚠️ ALERT: Reserve mismatch detected!
Workflow Simulation Result: {"verified":false,"discrepancyPct":99.79}
```

---

## Environment Variables Reference

### Backend `.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `SEPOLIA_RPC_URL` | Sepolia RPC endpoint | `https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY` |
| `PRIVATE_KEY` | Deployer wallet private key | `0x...` |
| `RESERVE_ORACLE_ADDRESS` | ReserveOracle contract address | `0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc` |
| `EXCHANGE_REGISTRY_ADDRESS` | ExchangeRegistry contract address | `0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c` |
| `ALERT_CONTRACT_ADDRESS` | AlertContract contract address | `0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b` |
| `PORT` | Backend port (optional) | `3000` |

### Frontend `.env.local` 

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_BACKEND_URL` | Backend API URL | `https://proof-of-reserves-backend-new.onrender.com` |

---

## 🧪 Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat |
| Automation | Chainlink CRE (TypeScript workflows) |
| Backend | Node.js, Express, TypeScript, ethers.js v6 |
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Wallet Integration | MetaMask (ethers.js BrowserProvider) |
| Deployment | Render (Backend + Frontend as Web Services) |
| Network | Ethereum Sepolia Testnet |

---

## 📊 What's Real vs Simulated

### ✅ Production-Ready Components:
- ✅ Smart contracts deployed on Sepolia testnet
- ✅ On-chain balance fetching from live Sepolia data
- ✅ Verification logic (discrepancy calculation)
- ✅ Contract interactions (`updateReserveStatus`, `triggerAlert`)
- ✅ Frontend dashboard with MetaMask integration
- ✅ Backend API with full CRUD operations
- ✅ CRE workflow code (TypeScript)
- ✅ Deployed frontend and backend on Render
- ✅ Real on-chain transactions (verifiable on Etherscan)

###  Demo/Simulated for Hackathon:
- ⚠️ **Exchange claimed reserves** → Configured values (Binance: 0.22 ETH, Coinbase: 100.5 ETH)
  - Real exchanges don't expose public APIs for claimed reserves yet
- ⚠️ **Exchange wallet addresses** → Demo Sepolia test address (`0x818E...5F28`)
  - Real exchanges have cold wallets, but would need permission to monitor
- ⚠️ **CRE automation** → Running in simulation mode only
  - Production deployment pending early access approval from Chainlink
- ⚠️ **5% threshold** → Hardcoded value
  - Production system would need DAO governance or industry standards

---

---

## 🔍 Quick Links

| Resource | URL |
|----------|-----|
| Live Demo | https://chainlink-proof-of-reserves.onrender.com |
| Backend API | https://proof-of-reserves-backend-new.onrender.com |
| GitHub Repo | https://github.com/jevinjojo/chainlink-proof-of-reserves |
| ReserveOracle | https://sepolia.etherscan.io/address/0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc |
| AlertContract | https://sepolia.etherscan.io/address/0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b |
| ExchangeRegistry | https://sepolia.etherscan.io/address/0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c |
