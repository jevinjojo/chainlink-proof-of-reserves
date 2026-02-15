import { useState, useEffect } from "react";

interface ReserveStatus {
    wallet: string;
    claimed: number;
    actualBalance: number;
    verified: boolean;
    discrepancyPct: number;
}

interface OnChainStatus {
    updateTxHash: string | null;
    alertTxHash: string | null;
    onChainLoading: boolean;
    storedReserve: {
        verified: boolean;
        discrepancyPct: string;
        timestamp: string;
    } | null;
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export function useReserve(wallet: string, claimed: number, exchangeId: number = 1) {
    const [data, setData] = useState<ReserveStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [onChain, setOnChain] = useState<OnChainStatus>({
        updateTxHash: null,
        alertTxHash: null,
        onChainLoading: false,
        storedReserve: null,
    });

    useEffect(() => {
        async function fetchReserve() {
            await new Promise(resolve => setTimeout(resolve, exchangeId * 8000));

            try {
                // Step 1: Fetch live verification result
                const res = await fetch(
                    `${BACKEND_URL}/check/ethereum/${wallet}/${claimed}`,
                    { headers: { "ngrok-skip-browser-warning": "true" } }
                );
                const json: ReserveStatus = await res.json();
                setData(json);

                // Step 2: Write result to ReserveOracle on-chain
                setOnChain(prev => ({ ...prev, onChainLoading: true }));

                const updateRes = await fetch(
                    `${BACKEND_URL}/reserve/${exchangeId}/update`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "ngrok-skip-browser-warning": "true"
                        },
                        body: JSON.stringify({
                            verified: json.verified,
                            discrepancyPct: Math.round(json.discrepancyPct),
                        }),
                    }
                );

                if (!updateRes.ok) {
                    console.error("Reserve update failed:", await updateRes.text());
                } else {
                    const updateData = await updateRes.json();
                    setOnChain(prev => ({ ...prev, updateTxHash: updateData.txHash }));
                }

                // Step 3: If not verified, trigger AlertContract
                if (!json.verified) {
                    await new Promise(resolve => setTimeout(resolve, 5000));

                    const alertRes = await fetch(
                        `${BACKEND_URL}/alert/${exchangeId}`,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                "ngrok-skip-browser-warning": "true"
                            },
                            body: JSON.stringify({
                                issue: `Reserve mismatch: ${json.discrepancyPct.toFixed(2)}% discrepancy detected`,
                            }),
                        }
                    );

                    if (!alertRes.ok) {
                        console.error("Alert failed:", await alertRes.text());
                    } else {
                        const alertData = await alertRes.json();
                        setOnChain(prev => ({ ...prev, alertTxHash: alertData.txHash }));
                    }
                }

                // Step 4: Read back stored reserve from ReserveOracle
                await new Promise(resolve => setTimeout(resolve, 3000));

                const storedRes = await fetch(
                    `${BACKEND_URL}/reserve/${exchangeId}`,
                    { headers: { "ngrok-skip-browser-warning": "true" } }
                );

                if (storedRes.ok) {
                    const storedData = await storedRes.json();
                    setOnChain(prev => ({
                        ...prev,
                        storedReserve: {
                            verified: storedData.verified,
                            discrepancyPct: storedData.discrepancyPct,
                            timestamp: new Date(Number(storedData.timestamp) * 1000).toLocaleTimeString(),
                        }
                    }));
                }

            } catch (err) {
                console.error("Error:", err);
                setError("Failed to fetch reserve data");
            } finally {
                setLoading(false);
                setOnChain(prev => ({ ...prev, onChainLoading: false }));
            }
        }
        fetchReserve();
    }, [wallet, claimed, exchangeId]);

    return { data, loading, error, onChain };
}