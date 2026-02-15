"use client";

import React from "react";
import { useReserve } from "../hooks/useReserve";
import VerificationBadge from "./VerificationBadge";

interface Props {
    exchangeName: string;
    wallet: string;
    claimed: number;
    exchangeId: number;
}

export default function ExchangeCard({ exchangeName, wallet, claimed, exchangeId }: Props) {
    const { data, loading, error, onChain } = useReserve(wallet, claimed, exchangeId);

    if (loading) {
        return (
            <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-lg animate-pulse">
                <div className="flex items-center justify-between mb-6">
                    <div className="h-5 w-32 bg-slate-100 rounded" />
                    <div className="h-6 w-24 bg-slate-100 rounded-full" />
                </div>
                <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-3 w-16 bg-slate-100 rounded" />
                            <div className="h-5 w-24 bg-slate-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-lg">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                        <span className="text-slate-600 text-sm">⚠</span>
                    </div>
                    <div>
                        <p className="text-slate-700 font-medium">Failed to fetch reserve data</p>
                        <p className="text-slate-500 text-sm">Please check your connection and try again.</p>
                    </div>
                </div>
            </div>
        );
    }

    const discrepancyColor =
        data.discrepancyPct > 10
            ? "text-red-600"
            : data.discrepancyPct > 5
                ? "text-yellow-600"
                : "text-green-600";

    const shortWallet = `${data.wallet.slice(0, 6)}...${data.wallet.slice(-4)}`;

    return (
        <div className={`border rounded-xl p-6 bg-white shadow-lg transition-all hover:shadow-xl ${data.verified ? "border-green-200" : "border-red-200"}`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${data.verified ? "bg-green-600 text-white" : "bg-red-600 text-white"
                        }`}>
                        {exchangeName.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h2 className="text-slate-900 font-semibold text-lg">{exchangeName}</h2>
                        <a
                            href={`https://sepolia.etherscan.io/address/${data.wallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-500 text-xs hover:text-slate-700 transition-colors font-mono"
                        >
                            {shortWallet} ↗
                        </a>
                    </div>
                </div>
                <VerificationBadge verified={data.verified} />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wider">Claimed</p>
                    <p className="text-slate-900 font-mono font-semibold text-lg">{data.claimed} ETH</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wider">Actual</p>
                    <p className="text-slate-900 font-mono font-semibold text-lg">
                        {Number(data.actualBalance).toFixed(4)} ETH
                    </p>
                </div>
                <div className="bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-medium mb-2 uppercase tracking-wider">Discrepancy</p>
                    <p className={`font-mono font-semibold text-lg ${discrepancyColor}`}>
                        {data.discrepancyPct.toFixed(2)}%
                    </p>
                </div>
            </div>

            {/* Alert bar */}
            {!data.verified && (
                <div className="bg-red-50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <p className="text-slate-700 text-sm font-medium">
                        Reserve mismatch detected — discrepancy exceeds threshold
                    </p>
                </div>
            )}

            {data.verified && (
                <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <p className="text-slate-700 text-sm font-medium">
                        Reserves verified — within acceptable threshold
                    </p>
                </div>
            )}


            {onChain.storedReserve && (
                <div className="mt-4 bg-slate-50 rounded-lg p-4">
                    <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wider">On-Chain Stored (ReserveOracle)</p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${onChain.storedReserve.verified ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                {onChain.storedReserve.verified ? "✓ Verified" : "✗ Mismatch"}
                            </span>
                            <span className="text-slate-600 font-mono">Discrepancy: {onChain.storedReserve.discrepancyPct}%</span>
                        </div>
                        <span className="text-slate-400 text-xs font-mono">Updated: {onChain.storedReserve.timestamp}</span>
                    </div>
                </div>
            )}
        </div>
    );
}