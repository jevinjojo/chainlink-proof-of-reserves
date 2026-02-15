"use client";

import { useState } from "react";
import { ethers } from "ethers";

interface Props {
    onConnected: (address: string) => void;
}

export default function WalletConnectButton({ onConnected }: Props) {
    const [address, setAddress] = useState<string | null>(null);

    async function connectWallet() {
        if (!window.ethereum) {
            alert("MetaMask not found. Please install it.");
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const addr = await signer.getAddress();
            setAddress(addr);
            onConnected(addr); // 🔥 send address up to parent
        } catch (err) {
            console.error("Wallet connect failed:", err);
        }
    }

    return (
        <button
            onClick={connectWallet}
            className={`px-4 py-2 rounded-lg font-mono transition-all ${address
                ? "bg-white text-slate-900 border-2 border-yellow-400 hover:bg-yellow-50 shadow-md"
                : "bg-green-600 text-white hover:bg-green-500"
                }`}
        >
            {address ? `Connected: ${address.slice(0, 6)}...${address.slice(-4)}` : "Connect Wallet"}
        </button>
    );
}