"use client";

import React, { useEffect } from "react";
import Confetti from "./Confetti";

type PrizeModalProps = {
  open: boolean;
  onCloseAction: () => void;
};

export default function PrizeModal({ open, onCloseAction }: PrizeModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseAction();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCloseAction]);

  // prevent body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      aria-modal
      role="dialog"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseAction();
      }}
    >
      <div className="absolute inset-0 bg-black/50" />

      <div className="relative z-10 max-w-3xl w-full mx-4">
        <div className="bg-white rounded-2xl p-6 shadow-xl border border-black/5">
          <button
            aria-label="Close prize modal"
            onClick={onCloseAction}
            className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-900 text-white"
          >
            ×
          </button>

          <h3 className="text-lg font-bold mb-2">Surprise prize 🎉</h3>
          <p className="text-sm text-slate-700 mb-4">
            Be among the 50 first customers to book a tour for 2026 or 2027 and earn a 500$ bonus for 2 travelers.
            <br />
            Your bonus will be waiting for you in your dashboard, without expiry date, available to use for the 50 first reservations of the new Ibero Website.
          </p>

          <div className="text-sm text-slate-600">The bonus will be applied automatically to qualifying accounts and visible in your dashboard once your reservation is processed.</div>
        </div>
      </div>

      {/* Confetti mounted while modal open */}
      <Confetti duration={3000} />
    </div>
  );
}
