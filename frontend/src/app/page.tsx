"use client";

import { useState } from "react";
import ExchangeCard from "@/components/ExchangeCard";
import WalletConnectButton from "@/components/WalletConnectButton";
export default function Home() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-linear-to-br from-yellow-50 via-white to-yellow-100 p-8 font-mono">
      <div className="relative max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12 pt-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">
              Proof of Reserves<span className="text-yellow-600">.</span>
            </h1>
            <p className="text-gray-600 mt-2 text-sm">
              Real-time on-chain verification · Sepolia Testnet
            </p>
          </div>
          <WalletConnectButton onConnected={setConnectedWallet} />
        </div>

        {/* Exchange Cards */}
        <div className="space-y-4">
          {/* Always show default exchanges */}
          <ExchangeCard
            exchangeName="Binance (Demo)"
            wallet="0x818E9F62846fCC335a4090BAB9458748f34d5F28"
            claimed={0.21}
            exchangeId={1}
          />
          <ExchangeCard
            exchangeName="Coinbase (Demo)"
            wallet="0x818E9F62846fCC335a4090BAB9458748f34d5F28"
            claimed={100.5}
            exchangeId={2}
          />

          {/* Show connected wallet card when connected */}
          {connectedWallet && (
            <ExchangeCard
              exchangeName="Your Wallet"
              wallet={connectedWallet}
              claimed={100.5}
              exchangeId={2}
            />
          )}
        </div>
      </div>
    </main>
  );
}