# 🔍 Proof of Reserves Verifier

> **Automated, real-time proof of reserves verification using live on-chain data and Chainlink CRE automation.**

[![Sepolia Testnet](https://img.shields.io/badge/Network-Sepolia%20Testnet-blue)](https://sepolia.etherscan.io)
[![Chainlink CRE](https://img.shields.io/badge/Chainlink-CRE%20Automation-375BD2)](https://cre.chain.link)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## 🏆 Hackathon Tracks

This project is submitted under **two tracks**:

| Track | Why It Fits |
|-------|-------------|
| **DeFi & Tokenization** | Implements a fully functional Custom Proof of Reserve Data Feed — one of the listed DeFi example ideas. Verifies exchange reserves against live on-chain balances and writes results to a `ReserveOracle` smart contract. |
| **Risk & Compliance** | Automated real-time reserve health checks, on-chain protocol safeguard triggers via `AlertContract`, and discrepancy monitoring — matching all three listed use cases for this track exactly. |

---

## ❗ The Problem

After FTX collapsed and wiped out billions in customer funds, it became clear that centralized exchanges could publish **fake reserve numbers** with zero consequences. Most existing "Proof of Reserves" solutions are fundamentally broken:

- 📸 Snapshot-based — not real-time
- 🔒 Reliant on third-party auditors with zero on-chain transparency
- 🚫 No automated alerting when reserves fall below claimed amounts
- 👤 Users have no way to independently verify anything

---

## ✅ The Solution

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
Backend API (Express + TypeScript) — Port 3000
       ↓
Ethereum Balance Fetch (Sepolia via ethers.js v6)
       ↓
Discrepancy Verifier (5% threshold calculation)
       ↓
ReserveOracle.sol (stores verified result on-chain)
       ↓
AlertContract.sol (fires alert event if mismatch)
       ↓
Frontend Dashboard (Next.js, Port 3001) + MetaMask
```

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
│   ├── hardhat.config.ts
│   └── package.json
│
├── cre-workflows/                      # Chainlink CRE automation
│   └── proof-of-reserves/
│       └── reserve-check/
│           ├── main.ts                 # CRE workflow — cron trigger + verification logic
│           ├── workflow.yaml           # Staging + production workflow definitions
│           ├── config.staging.json     # Staging config (every 30s)
│           ├── config.production.json  # Production config (hourly)
│           └── package.json
│
├── backend/                            # Node.js + Express + TypeScript
│   └── src/
│       ├── index.ts                    # API routes + contract interaction + nonce management
│       ├── ai/
│       │   └── verifier.ts             # Discrepancy calculation logic
│       ├── chains/
│       │   └── ethereum.ts             # Live ETH balance fetcher (Sepolia)
│       └── abi/                        # Contract ABIs
│           ├── ReserveOracle.json
│           ├── AlertContract.json
│           └── ExchangeRegistry.json
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

## 🔗 Live Contracts (Sepolia Testnet)

| Contract | Address | Etherscan |
|----------|---------|-----------|
| `ReserveOracle` | `0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc` | [View ↗](https://sepolia.etherscan.io/address/0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc) |
| `ExchangeRegistry` | `0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c` | [View ↗](https://sepolia.etherscan.io/address/0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c) |
| `AlertContract` | `0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b` | [View ↗](https://sepolia.etherscan.io/address/0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b) |

Real `updateReserveStatus` and `triggerAlert` transactions fire every ~30 seconds. Decoding the input data on alert transactions shows the exact discrepancy message (e.g. `"Reserve mismatch: 99.95% discrepancy detected"`).

---

## ⚙️ How It Works

### Verification Logic

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

The CRE workflow runs on a cron schedule (`*/30 * * * * *`):

```typescript
// main.ts — simplified
const result = await httpClient.get(`/check/ethereum/${wallet}/${claimed}`);
const { verified, discrepancyPct, actualBalance } = result.json();

if (!verified) {
  console.log(`⚠️ ALERT: Reserve mismatch! Discrepancy: ${discrepancyPct}%`);
}

return { verified, discrepancyPct };
```

**Real simulation output:**
```
[USER LOG] Running Proof of Reserves CronTrigger
[USER LOG] Starting Proof of Reserves check for wallet: 0x818E...
[USER LOG] Claimed reserves: 100.5 ETH
[USER LOG] Actual Balance: 0.1876 ETH
[USER LOG] Verified: false
[USER LOG] Discrepancy: 99.81%
[USER LOG] ⚠️ ALERT: Reserve mismatch detected! Discrepancy: 99.81%
Workflow Simulation Result: {"verified":false,"discrepancyPct":99.81}
```

---

## 🖥️ Demo Walkthrough

The demo uses two fixed exchange wallets to illustrate both verification outcomes:

| Exchange | Claimed | Actual | Discrepancy | Status |
|----------|---------|--------|-------------|--------|
| Binance (Demo) | 0.19 ETH | ~0.187 ETH | ~1.6% | ✅ Verified |
| Coinbase (Demo) | 100.5 ETH | ~0.187 ETH | ~99.8% | ❌ Mismatch |
| Your Wallet | 0.19 ETH | Real balance | Live | Dynamic |

- Exchange wallets and claimed reserves are **simulated**
- Verification logic, on-chain writes, and discrepancy calculation run against **real Sepolia data**
- Connecting your own MetaMask wallet adds a live third card

---

## 🚀 Running It Locally

### Prerequisites

- Node.js 18+
- MetaMask browser extension with Sepolia testnet ETH
- ngrok (to expose backend for CRE)

### 1. Smart Contracts (already deployed — skip if not redeploying)

```bash
cd contracts
npm install
npx hardhat run scripts/deploy.ts --network sepolia
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev
# Runs on http://localhost:3000
```

### 3. Expose Backend with ngrok

```bash
ngrok http 3000
# Copy the public URL → paste into frontend .env.local and CRE config files
```

### 4. Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Set NEXT_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok-free.app
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

---

## 🔐 Environment Variables

### Backend `.env`

```env
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_wallet_private_key
RESERVE_ORACLE_ADDRESS=0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc
EXCHANGE_REGISTRY_ADDRESS=0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c
ALERT_CONTRACT_ADDRESS=0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b
```

### Frontend `.env.local`

```env
NEXT_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok-free.app
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat |
| Automation | Chainlink CRE (TypeScript workflows) |
| Backend | Node.js, Express, TypeScript, ethers.js v6 |
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Wallet | MetaMask (ethers.js BrowserProvider) |
| Network | Ethereum Sepolia Testnet |

---

## 👤 Team

Built solo for the **Chainlink Hackathon 2026**.

---
