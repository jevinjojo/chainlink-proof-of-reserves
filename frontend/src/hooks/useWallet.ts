"use client";

import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";

interface WalletState {
    address: string | null;
    balance: string | null;
    chainId: number | null;
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
}

export function useWallet() {
    const [wallet, setWallet] = useState<WalletState>({
        address: null,
        balance: null,
        chainId: null,
        isConnected: false,
        isConnecting: false,
        error: null,
    });

    const connect = useCallback(async () => {
        if (typeof window === "undefined" || !window.ethereum) {
            setWallet(prev => ({ ...prev, error: "MetaMask not installed" }));
            return;
        }

        setWallet(prev => ({ ...prev, isConnecting: true, error: null }));

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send("eth_requestAccounts", []);
            const signer = await provider.getSigner();
            const address = await signer.getAddress();
            const balance = await provider.getBalance(address);
            const network = await provider.getNetwork();

            setWallet({
                address,
                balance: parseFloat(ethers.formatEther(balance)).toFixed(4),
                chainId: Number(network.chainId),
                isConnected: true,
                isConnecting: false,
                error: null,
            });
        } catch (err: any) {
            setWallet(prev => ({
                ...prev,
                isConnecting: false,
                error: err.message || "Failed to connect",
            }));
        }
    }, []);

    const disconnect = useCallback(() => {
        setWallet({
            address: null,
            balance: null,
            chainId: null,
            isConnected: false,
            isConnecting: false,
            error: null,
        });
    }, []);

    // Listen for account/chain changes
    useEffect(() => {
        if (typeof window === "undefined" || !window.ethereum) return;

        const handleAccountsChanged = (accounts: string[]) => {
            if (accounts.length === 0) {
                disconnect();
            } else {
                setWallet(prev => ({ ...prev, address: accounts[0] }));
            }
        };

        const handleChainChanged = () => {
            window.location.reload();
        };

        window.ethereum.on("accountsChanged", handleAccountsChanged);
        window.ethereum.on("chainChanged", handleChainChanged);

        return () => {
            window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
            window.ethereum.removeListener("chainChanged", handleChainChanged);
        };
    }, [disconnect]);

    return { wallet, connect, disconnect };
}