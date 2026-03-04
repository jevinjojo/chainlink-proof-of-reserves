"use client";

import { useState } from "react";
import { ethers } from "ethers";

interface Props {
    onConnected: (address: string) => void;
    onDisconnected: () => void;
}

export default function WalletConnectButton({ onConnected, onDisconnected }: Props) {
    const [address, setAddress] = useState<string | null>(null);

    async function connectWallet() {
        if (!window.ethereum) {
            alert("MetaMask not found. Please install it.");
            return;
        }

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
        }
    }

    function disconnectWallet() {
        setAddress(null);
        onDisconnected();
    }

    if (address) {
        return (
            <div className="flex items-center gap-2">
                <span className="px-4 py-2 rounded-lg font-mono bg-white text-slate-900 border-2 border-yellow-400 shadow-md">
                    Connected: {address.slice(0, 6)}...{address.slice(-4)}
                </span>
                <button
                    onClick={disconnectWallet}
                    className="px-4 py-2 rounded-lg font-mono bg-red-500 text-white hover:bg-red-400 transition-all"
                >
                    Disconnect
                </button>
            </div>
        );
    }

    return (
        <button
            onClick={connectWallet}
            className="px-4 py-2 rounded-lg font-mono bg-green-600 text-white hover:bg-green-500 transition-all"
        >
            Connect Wallet
        </button>
    );
}