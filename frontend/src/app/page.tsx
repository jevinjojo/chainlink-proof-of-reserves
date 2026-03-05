"use client";

import { useState } from "react";
import ExchangeCard from "@/components/ExchangeCard";
import WalletConnectButton from "@/components/WalletConnectButton";
import { useWallet } from "@/hooks/useWallet";
export default function Home() {
  const [connectedWallet, setConnectedWallet] = useState<string | null>(null);
  const { wallet, connect, disconnect } = useWallet();

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
          {/* Replace WalletConnectButton with direct hook usage */}
          <div>
            {wallet.address ? (
              <div className="flex items-center gap-2">
                <span className="px-4 py-2 rounded-lg font-mono bg-white text-slate-900 border-2 border-yellow-400 shadow-md">
                  Connected: {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
                <button
                  onClick={disconnect}
                  className="px-4 py-2 rounded-lg font-mono bg-red-500 text-white hover:bg-red-400 transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                className="px-4 py-2 rounded-lg font-mono bg-green-600 text-white hover:bg-green-500 transition-all"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>

        {/* Exchange Cards */}
        <div className="space-y-4">
          {/* Always show default exchanges */}
          <ExchangeCard
            exchangeName="Binance (Demo)"
            wallet="0x818E9F62846fCC335a4090BAB9458748f34d5F28"
            claimed={0.19}
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
              claimed={0.19}
              exchangeId={3}
            />
          )}
        </div>
      </div>
    </main>
  );
}