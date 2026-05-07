"use client";

import { useState } from "react";
import ExchangeCard from "@/components/ExchangeCard";
import WalletConnectButton from "@/components/WalletConnectButton";

export default function Home() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      {/* Top bar */}
      <div className="bg-slate-900 text-slate-400 text-xs py-2 px-4 text-center font-mono tracking-wide">
        <span className="inline-flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block pulse-dot" />
          Live on Ethereum Sepolia Testnet
          <span className="mx-2 text-slate-600">·</span>
          <a
            href="https://sepolia.etherscan.io"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-slate-200 transition-colors"
          >
            Sepolia Etherscan ↗
          </a>
        </span>
      </div>

      {/* Main content */}
      <main className="flex-1 px-4 py-8 md:px-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
            <div className="flex items-center gap-3">
              {/* Chainlink-style hex icon */}
              <div className="relative w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" role="img" aria-label="Chainlink logo">
                  <polygon
                    points="20,2 36,11 36,29 20,38 4,29 4,11"
                    fill="#375BD2"
                    stroke="#2A4AB0"
                    strokeWidth="1"
                  />
                  <polygon
                    points="20,10 28,15 28,25 20,30 12,25 12,15"
                    fill="none"
                    stroke="white"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">
                  Proof of Reserves
                </h1>
                <p className="text-slate-500 text-xs mt-0.5 font-mono">
                  Powered by Chainlink CRE Automation
                </p>
              </div>
            </div>
            <WalletConnectButton
              onConnected={setConnectedWallet}
              onDisconnected={() => setConnectedWallet(null)}
            />
          </header>

          {/* Section label */}
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
              Exchange Reserves
            </p>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {/* Exchange Cards */}
          <div className="space-y-4 fade-in">
            <ExchangeCard
              exchangeName="Binance"
              wallet="0x818E9F62846fCC335a4090BAB9458748f34d5F28"
              claimed={0.22}
              exchangeId={1}
            />
            <ExchangeCard
              exchangeName="Coinbase"
              wallet="0x818E9F62846fCC335a4090BAB9458748f34d5F28"
              claimed={100.5}
              exchangeId={2}
            />

            {connectedWallet && (
              <ExchangeCard
                exchangeName="Your Wallet"
                wallet={connectedWallet}
                claimed={0.19}
                exchangeId={3}
              />
            )}
          </div>

          {/* Connect wallet CTA — only when not connected */}
          {!connectedWallet && (
            <div className="mt-6 border border-dashed border-slate-300 rounded-xl p-6 text-center bg-white">
              <p className="text-slate-500 text-sm mb-1">Connect MetaMask to verify your own wallet</p>
              <p className="text-slate-400 text-xs font-mono">Switch to Sepolia Testnet before connecting</p>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-4 md:px-8">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-4">
            <span>© 2024 Proof of Reserves</span>
            <span className="text-slate-300">·</span>
            <a
              href="https://github.com/jevinjojo/chainlink-proof-of-reserves"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              GitHub ↗
            </a>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://sepolia.etherscan.io/address/0x83d595E9eb57AA07C4CAB174B43299A9fd79a0dc"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              ReserveOracle ↗
            </a>
            <a
              href="https://sepolia.etherscan.io/address/0x738CFBB63F0A6675638E862F6Ec3E5d52A95e13b"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-600 transition-colors"
            >
              AlertContract ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
