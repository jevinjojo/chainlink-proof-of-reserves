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
