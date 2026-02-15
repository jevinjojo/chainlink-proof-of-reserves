// src/ai/verifier.ts
export interface VerificationResult {
    verified: boolean;
    discrepancyPct: number;
}

export function verifyReserves(
    claimed: number,
    actual: number
): VerificationResult {
    if (claimed === 0) {
        return { verified: false, discrepancyPct: 100 };
    }

    const discrepancy = Math.abs(claimed - actual);
    const discrepancyPct = (discrepancy / claimed) * 100;

    // Example rule: verified if discrepancy < 5%
    const verified = discrepancyPct < 5;

    return { verified, discrepancyPct };
}
