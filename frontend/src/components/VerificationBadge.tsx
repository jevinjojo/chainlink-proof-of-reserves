"use client";

import React from "react";

interface Props {
    verified: boolean;
}

export default function VerificationBadge({ verified }: Props) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${verified
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-red-50 text-red-700 border-red-200"
                }`}
            aria-label={verified ? "Verification status: Verified" : "Verification status: Mismatch"}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${verified ? "bg-emerald-500" : "bg-red-500 pulse-dot"}`}
                aria-hidden="true"
            />
            {verified ? "Verified" : "Mismatch"}
        </span>
    );
}
