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

function LoadingSkeleton() {
    return (
        <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg skeleton" />
                    <div className="space-y-1.5">
                        <div className="h-4 w-28 skeleton rounded" />
                        <div className="h-3 w-36 skeleton rounded" />
                    </div>
                </div>
                <div className="h-6 w-20 skeleton rounded-full" />
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-slate-50 rounded-lg p-3 space-y-2">
                        <div className="h-2.5 w-14 skeleton rounded" />
                        <div className="h-5 w-20 skeleton rounded" />
                    </div>
                ))}
            </div>
            <div className="h-10 skeleton rounded-lg" />
        </div>
    );
}

export default function ExchangeCard({ exchangeName, wallet, claimed, exchangeId }: Props) {
    const { data, loading, error, onChain } = useReserve(wallet, claimed, exchangeId);

    if (loading) return <LoadingSkeleton />;

    if (error || !data) {
        return (
            <div className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
                <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
                        <span className="text-amber-500 text-sm">⚠</span>
                    </div>
                    <div>
                        <p className="text-slate-800 font-medium text-sm">Failed to fetch reserve data</p>
                        <p className="text-slate-500 text-xs mt-0.5">Check your connection and try refreshing.</p>
                    </div>
                </div>
            </div>
        );
    }

    const discrepancyColor =
        data.discrepancyPct > 10
            ? "text-red-600"
            : data.discrepancyPct > 5
                ? "text-amber-600"
                : "text-emerald-600";

    const discrepancyBg =
        data.discrepancyPct > 10
            ? "bg-red-50"
            : data.discrepancyPct > 5
                ? "bg-amber-50"
                : "bg-emerald-50";

    const initials = exchangeName.slice(0, 2).toUpperCase();
    const shortWallet = `${data.wallet.slice(0, 6)}...${data.wallet.slice(-4)}`;

    return (
        <div className={`border rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md ${data.verified ? "border-slate-200" : "border-red-200"}`}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${data.verified ? "bg-[#375BD2] text-white" : "bg-red-500 text-white"}`}>
                        {initials}
                    </div>
                    <div>
                        <h2 className="text-slate-900 font-semibold text-sm leading-tight">{exchangeName}</h2>
                        <a
                            href={`https://sepolia.etherscan.io/address/${data.wallet}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 text-xs hover:text-[#375BD2] transition-colors font-mono"
                        >
                            {shortWallet} ↗
                        </a>
                    </div>
                </div>
                <VerificationBadge verified={data.verified} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100">
                <div className="px-4 py-3">
                    <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Claimed</p>
                    <p className="text-slate-900 font-mono font-semibold text-sm">{data.claimed} ETH</p>
                </div>
                <div className="px-4 py-3">
                    <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Actual</p>
                    <p className="text-slate-900 font-mono font-semibold text-sm">
                        {Number(data.actualBalance).toFixed(4)} ETH
                    </p>
                </div>
                <div className={`px-4 py-3 ${discrepancyBg}`}>
                    <p className="text-slate-400 text-xs font-medium mb-1 uppercase tracking-wider">Discrepancy</p>
                    <p className={`font-mono font-semibold text-sm ${discrepancyColor}`}>
                        {data.discrepancyPct.toFixed(2)}%
                    </p>
                </div>
            </div>

            {/* Status bar */}
            <div className={`px-5 py-3 flex items-center gap-2.5 ${data.verified ? "bg-emerald-50" : "bg-red-50"}`}>
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${data.verified ? "bg-emerald-500" : "bg-red-500 pulse-dot"}`} />
                <p className={`text-xs font-medium ${data.verified ? "text-emerald-700" : "text-red-700"}`}>
                    {data.verified
                        ? "Reserves verified — within acceptable threshold"
                        : "Reserve mismatch detected — discrepancy exceeds threshold"}
                </p>
            </div>

            {/* On-chain section */}
            {onChain.storedReserve && (
                <div className="px-5 py-3 border-t border-slate-100">
                    <p className="text-slate-400 text-xs font-medium mb-2 uppercase tracking-wider">
                        On-Chain · ReserveOracle
                    </p>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${onChain.storedReserve.verified ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                {onChain.storedReserve.verified ? "✓ Verified" : "✗ Mismatch"}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">
                                {onChain.storedReserve.discrepancyPct}% discrepancy
                            </span>
                        </div>
                        <span className="text-slate-400 text-xs font-mono">
                            {onChain.storedReserve.timestamp}
                        </span>
                    </div>
                </div>
            )}

            {/* TX hashes */}
            {(onChain.updateTxHash || onChain.alertTxHash) && (
                <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-3">
                    {onChain.updateTxHash && (
                        <a
                            href={`https://sepolia.etherscan.io/tx/${onChain.updateTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono text-[#375BD2] hover:text-[#2A4AB0] transition-colors"
                        >
                            Update tx: {onChain.updateTxHash.slice(0, 8)}… ↗
                        </a>
                    )}
                    {onChain.alertTxHash && (
                        <a
                            href={`https://sepolia.etherscan.io/tx/${onChain.alertTxHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-mono text-red-500 hover:text-red-700 transition-colors"
                        >
                            Alert tx: {onChain.alertTxHash.slice(0, 8)}… ↗
                        </a>
                    )}
                </div>
            )}
        </div>
    );
}
