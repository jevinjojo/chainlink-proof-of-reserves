"use client";

import React from "react";

interface Props {
    verified: boolean;
}

export default function VerificationBadge({ verified }: Props) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm ${verified
                ? "bg-green-600 text-white border-green-700"
                : "bg-red-600 text-white border-red-700"
                }`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${verified ? "bg-green-600" : "bg-red-600 animate-pulse"}`} />
            {verified ? "Verified" : "Mismatch"}
        </span>
    );
}