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

## 🗺️ What's Next

- Multi-chain support (Bitcoin, Solana, Arbitrum)
- Real exchange API integrations once PoR standards mature
- Production CRE deployment once full access is granted
- DAO governance for threshold parameter adjustments
- Historical reserve tracking with a proper database
- Public API so DeFi protocols can consume reserve data directly

---

## 📹 Demo Video Script (3–5 Minutes)

> Use this script for your hackathon video submission. Timestamps are approximate.

---

### **[0:00 – 0:30] — Introduction & Problem Statement**

🎯 *Start screen: project README or a blank screen. Speak to camera or voiceover.*

> "After FTX collapsed, billions in customer funds disappeared overnight — because exchanges could lie about their reserves with zero consequences. Most Proof of Reserve solutions today are still just periodic snapshots done by auditors. There's no real-time verification, no automated alerting, and users can't independently verify anything.
>
> This project fixes that. I built a fully automated Proof of Reserves verifier using Chainlink CRE that runs every 30 seconds, fetches live on-chain balances, and writes verified results directly to a smart contract — no auditors, no trust required."

---

### **[0:30 – 1:00] — Show the Live Dashboard**

🎯 *Switch to browser. Open `http://localhost:3001`.*

> "Here's the live dashboard running on Sepolia testnet. You can see two demo exchange cards already loaded — Binance and Coinbase."

👆 **Point to Binance card:**
> "Binance claimed 0.19 ETH in reserves. The system fetched the actual on-chain balance — 0.187 ETH — and the discrepancy is just 1.6%. That's within our 5% threshold, so it's marked **Verified**."

👆 **Point to Coinbase card:**
> "Coinbase claimed 100.5 ETH. The actual balance? 0.187 ETH. That's a 99.8% discrepancy — a massive mismatch. The system caught it and flagged it immediately."

👆 **Point to the 'On-Chain Stored' section on both cards:**
> "And these results aren't just displayed in the UI — they're written to our ReserveOracle smart contract on Sepolia in real-time. You can see the stored status and timestamp right here."

---

### **[1:00 – 1:45] — Connect MetaMask Wallet**

🎯 *Click the "Connect Wallet" button in the top right.*

> "I'll now connect my MetaMask wallet. Notice — the app always forces a permission popup. It never silently reconnects. You always have to confirm."

🖱️ *MetaMask popup appears. Select account. Confirm.*

> "Once connected, a third card appears — 'Your Wallet' — with my real live balance checked against the same 0.19 ETH claimed amount. It's showing Verified."

👆 **Point to Your Wallet card:**
> "This card is fully dynamic — whoever connects their wallet gets a live reserve check run against their real Sepolia balance instantly."

🖱️ *Click the Etherscan link (↗) on any card.*
> "Each card links directly to Etherscan so you can verify the wallet address independently."

---

### **[1:45 – 2:30] — Show Live Etherscan Transactions**

🎯 *Open Sepolia Etherscan for the deployer wallet: `https://sepolia.etherscan.io/address/0x818E9F62846fCC335a4090BAB9458748f34d5F28`*

> "Here's the on-chain proof. You can see transactions firing every 30 seconds — these are real `updateReserveStatus` calls to the ReserveOracle and `triggerAlert` calls to the AlertContract."

👆 **Click on a `triggerAlert` transaction:**
> "If I open one of these alert transactions and decode the input data, you can see the exact discrepancy message — 'Reserve mismatch: 99.95% discrepancy detected' — encoded directly into the transaction. This is fully verifiable by anyone, forever, on-chain."

🎯 *Open ReserveOracle contract on Etherscan:*
> "And here's the ReserveOracle contract itself — you can call `getReserveStatus` with any exchange ID and read back the stored verification result directly from the blockchain."

---

### **[2:30 – 3:15] — Run the Chainlink CRE Simulation**

🎯 *Switch to terminal.*

> "Now the most important part — the Chainlink CRE automation. This is what makes the system run without any human intervention."

🖱️ *Run:*
```bash
cd cre-workflows/proof-of-reserves
cre workflow simulate reserve-check
```

> "I'll select the cron-trigger option."

🖱️ *Select option 1.*

> "Watch the output..."

👆 **Point to terminal logs as they appear:**
> "It fetched the live wallet balance from Sepolia, compared it to the claimed amount, calculated the discrepancy — 99.81% — and flagged an alert. The whole pipeline ran end-to-end in seconds."

> "CRE is still in early access, so this runs as a local simulation — but the workflow code is production-ready. The same logic runs against real Sepolia data and the results are written on-chain as you saw on Etherscan."

---

### **[3:15 – 3:45] — Show the Code (Quick)**

🎯 *Open your editor or file explorer briefly.*

> "Quick look at the architecture — four folders:"

👆 **Point to each folder:**
- `contracts/` — "Three Solidity contracts: ReserveOracle stores results, AlertContract fires events, ExchangeRegistry maps wallets."
- `backend/` — "Express API with five endpoints. The key one is `/check/ethereum/:wallet/:claimed` — it fetches the live balance and runs the discrepancy check."
- `cre-workflows/` — "The Chainlink CRE workflow in TypeScript. Cron-triggered every 30 seconds."
- `frontend/` — "Next.js dashboard with MetaMask integration and live on-chain reads."

---

### **[3:45 – 4:00] — Closing**

🎯 *Back to dashboard or camera.*

> "This is a fully working, end-to-end proof of reserves system. No auditors. No trust. Just live on-chain data, automated verification, and immutable results.
>
> In production, exchanges would publish their claimed reserves through the API, and the system would verify against their live on-chain balances continuously — every 30 seconds. Any discrepancy above 5% triggers an on-chain alert that anyone can see.
>
> Thanks for watching."

---

## 👤 Team

Built solo for the **Chainlink Hackathon 2026**.

---

## 📄 License

MIT
# Proof of Reserves Verifier 

Automated proof of reserves verification using on-chain data and Chainlink CRE automation.

---

## The Problem

After FTX collapsed, it became clear that centralized exchanges could publish fake reserve numbers and hide insolvency with no real consequences. Most "Proof of Reserves" solutions out there are still pretty bad:

- They publish snapshots occasionally, not in real-time
- Users have no way to independently verify the claims
- Everything goes through third-party auditors with zero transparency

---

## How It Works

A fully automated reserve verification pipeline that:

1. Fetches claimed reserves from exchange APIs
2. Pulls actual on-chain balances across multiple chains
3. Runs a discrepancy check — if claimed vs actual diverges by more than 5%, it flags it
4. Writes the result to a `ReserveOracle` smart contract on-chain
5. Triggers an `AlertContract` when a mismatch is detected
6. The whole flow runs automatically on a cron schedule via Chainlink CRE

---

## Architecture

```
Chainlink CRE (Cron Trigger every 30s)
       ↓
Backend API (Express + TypeScript)
       ↓
Ethereum Balance Fetch (Sepolia)
       ↓
Discrepancy Verifier (Threshold Calculation)
       ↓
ReserveOracle.sol (stores result on-chain)
       ↓
AlertContract.sol (fires alert if mismatch)
       ↓
Frontend Dashboard (Next.js + MetaMask)
```

---

## Chainlink CRE Integration

The core of the automation is a Chainlink CRE workflow that runs on a cron schedule (`*/30 * * * * *`). It calls the backend API, gets the live on-chain balance, runs the verification logic, and logs everything with timestamps.

Here's what a real run looks like:

```
[USER LOG] Running Proof of Reserves CronTrigger
[USER LOG] Starting Proof of Reserves check for wallet: 0x818E...
[USER LOG] Claimed reserves: 100.5 ETH
[USER LOG] Actual Balance: 0.2181 ETH
[USER LOG] Verified: false
[USER LOG] Discrepancy: 99.78%
[USER LOG] ⚠️ ALERT: Reserve mismatch detected! Discrepancy: 99.78%
Workflow Simulation Result: {"verified":false,"discrepancyPct":99.78}
```

**Note on CRE access:** CRE is still in early access — access has been requested at https://cre.chain.link/request-access. The simulation runs locally against real Sepolia data and works end-to-end. The workflow code is production-ready.

---

## Live Contracts (Sepolia)

| Contract | Address |
|----------|---------|
| ReserveOracle | `0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc` |
| ExchangeRegistry | `0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c` |
| AlertContract | `0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b` |

Verified on Sepolia Etherscan:
- [ReserveOracle](https://sepolia.etherscan.io/address/0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc)
- [AlertContract](https://sepolia.etherscan.io/address/0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b)

Real `updateReserveStatus` and `triggerAlert` transactions are on-chain. Decoding the input data on alert transactions shows the exact discrepancy message (e.g. `"Reserve mismatch: 99.95% discrepancy detected"`).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Smart Contracts | Solidity 0.8.20, Hardhat |
| Automation | Chainlink CRE (TypeScript workflows) |
| Backend | Node.js, Express, TypeScript, ethers.js v6 |
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Wallet | MetaMask (ethers.js BrowserProvider) |
| Network | Ethereum Sepolia Testnet |

---

## Project Structure

```
proof-of-reserves/
├── contracts/                     # Solidity smart contracts
│   ├── ReserveOracle.sol          # Stores verification results on-chain
│   ├── ExchangeRegistry.sol       # Known exchange wallet registry
│   └── AlertContract.sol          # Emits on-chain alerts
│
├── cre-workflows/                 # Chainlink CRE automation
│   └── proof-of-reserves/
│       └── reserve-check/
│           ├── main.ts            # CRE workflow logic
│           ├── config.staging.json
│           └── config.production.json
│
├── backend/                       # Node.js + Express + TypeScript
│   └── src/
│       ├── chains/
│       │   └── ethereum.ts        # Pulls live ETH balance from Sepolia
│       ├── verifier/
│       │   └── verifier.ts        # Discrepancy calculation
│       ├── abi/                   # Contract ABIs
│       └── index.ts               # API routes + contract interactions
│
└── frontend/                      # Next.js dashboard
    └── src/
        ├── app/page.tsx
        ├── components/
        │   ├── ExchangeCard.tsx
        │   ├── VerificationBadge.tsx
        │   └── WalletConnectButton.tsx
        └── hooks/
            ├── useReserve.ts      # Verification + on-chain write
            └── useWallet.ts       # MetaMask connection
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Health check |
| GET | `/check/ethereum/:wallet/:claimed` | Fetch live balance + verify |
| GET | `/reserve/:exchangeId` | Read stored result from ReserveOracle |
| POST | `/reserve/:exchangeId/update` | Write verification result on-chain |
| POST | `/alert/:exchangeId` | Trigger AlertContract on-chain |

---

## Running It Locally

### Prerequisites
- Node.js 18+
- MetaMask with Sepolia testnet ETH
- ngrok (needed to expose the backend for CRE)

### 1. Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

### 2. Expose backend with ngrok
```bash
ngrok http 3000
# copy the public URL → paste it in your frontend .env and CRE config
```

### 3. Frontend
```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

### 4. Run the CRE workflow simulation
```bash
cd cre-workflows/proof-of-reserves
cre login
cre workflow simulate reserve-check
# pick option 1 (cron-trigger)
```

### Environment Variables

**Backend `.env`**
```
SEPOLIA_RPC_URL=
PRIVATE_KEY=
RESERVE_ORACLE_ADDRESS=0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc
EXCHANGE_REGISTRY_ADDRESS=0x01F3f9d3159cE1c42B7aEC5762d33DC1D0947a2c
ALERT_CONTRACT_ADDRESS=0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b
```

**Frontend `.env.local`**
```
NEXT_PUBLIC_BACKEND_URL=https://your-ngrok-url.ngrok-free.app
```

---

## Verification Logic

The discrepancy check is intentionally simple and auditable:

```typescript
const discrepancyPct = (Math.abs(claimed - actual) / claimed) * 100;
const verified = discrepancyPct < 5;
```

| Discrepancy | Status |
|-------------|--------|
| < 5% | Verified ✅ |
| 5% – 10% | Warning ⚠️ |
| > 10% | Mismatch ❌ |

---

## Demo Walkthrough

The demo uses two fake exchange wallets to show both sides of the verification:

| Exchange | Claimed | Actual | Discrepancy | Status |
|----------|---------|--------|-------------|--------|
| Binance (Demo) | 0.21 ETH | 0.203 ETH | ~3.2% | Verified ✅ |
| Coinbase (Demo) | 100.5 ETH | 0.203 ETH | ~99.8% | Mismatch ❌ |
| Connected Wallet | 100.5 ETH | Real balance | Live | Live |

The exchange wallets and claimed reserves are simulated — but the verification logic, on-chain writes, and discrepancy calculation all run against real Sepolia data. In production, exchanges would publish claimed reserves through the API and the system verifies against live on-chain balances continuously.

To test it:
1. Open the dashboard — Binance shows verified, Coinbase shows mismatch
2. Connect MetaMask → connected wallet gets added as a live check
3. Scroll to "On-Chain Stored" → results written to ReserveOracle
4. Run the CRE simulation in terminal → same flow, automated
5. Check Sepolia Etherscan → find a `triggerAlert` transaction and decode the input to see the exact discrepancy message

---

## What's Next

- Multi-chain support (Bitcoin, Solana, Arbitrum)
- Real exchange API integrations once PoR standards mature
- Production CRE deployment once access comes through
- DAO governance for adjusting the threshold parameters
- Historical reserve tracking with a proper database
- Public API so DeFi protocols can consume reserve data directly

---

## Team

Built for the Chainlink Hackathon.

---

## License

MIT
