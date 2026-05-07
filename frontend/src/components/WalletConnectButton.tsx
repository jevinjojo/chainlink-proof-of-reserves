"use client";

import { useState } from "react";
import { ethers } from "ethers";

interface Props {
    onConnected: (address: string) => void;
    onDisconnected: () => void;
}

export default function WalletConnectButton({ onConnected, onDisconnected }: Props) {
    const [address, setAddress] = useState<string | null>(null);
    const [connecting, setConnecting] = useState(false);

    async function connectWallet() {
        if (!window.ethereum) {
            alert("MetaMask not found. Please install it.");
            return;
        }

        setConnecting(true);
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            // Always force MetaMask popup — even if previously connected
            await provider.send("wallet_requestPermissions", [{ eth_accounts: {} }]);
            const signer = await provider.getSigner();
            const addr = await signer.getAddress();
            setAddress(addr);
            onConnected(addr);
        } catch (err) {
            console.error("Wallet connect failed:", err);
        } finally {
            setConnecting(false);
        }
    }

    function disconnectWallet() {
        setAddress(null);
        onDisconnected();
    }

    if (address) {
        return (
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white border border-slate-200 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                    <span className="text-slate-700 text-xs font-mono">
                        {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                </div>
                <button
                    onClick={disconnectWallet}
                    className="px-3 py-2 rounded-lg text-xs font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors border border-slate-200"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={connectWallet}
            disabled={connecting}
            aria-busy={connecting}
            aria-label={connecting ? "Connecting wallet…" : "Connect wallet"}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-[#375BD2] text-white hover:bg-[#2A4AB0] active:bg-[#1E3A9F] transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
        >
            {connecting ? (
                <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                    Connecting…
                </>
            ) : (
                <>
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M16 12h2" />
                    </svg>
                    Connect Wallet
                </>
            )}
        </button>
    );
}
