"use client";

import React from 'react';

interface Props {
  open: boolean;
  summary: React.ReactNode;
  depositAmount?: number;
  clientDepositAmount?: number | null;
  serverDepositAmount?: number | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmReservationModal({ open, summary, depositAmount, clientDepositAmount = null, serverDepositAmount = null, onCancel, onConfirm }: Props) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-auto w-full max-w-lg rounded-2xl bg-white p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-slate-900">Confirm reservation</h3>
        <div className="mt-3 text-sm text-slate-600">{summary}</div>
        {typeof depositAmount === 'number' && (
          <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm">
            Deposit required: <strong>${depositAmount.toLocaleString()}</strong>
          </div>
        )}

        {/* Show client/server comparison if provided */}
        {typeof clientDepositAmount === 'number' && typeof serverDepositAmount === 'number' && (
          <div className="mt-4 rounded-md bg-white p-3 text-sm border">
            <div className="text-sm text-slate-600">Deposit comparison</div>
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs text-slate-500">Your estimate</div>
              <div className="font-medium">${clientDepositAmount.toLocaleString()}</div>
            </div>
            <div className="mt-1 flex items-center justify-between">
              <div className="text-xs text-slate-500">Server price (authoritative)</div>
              <div className="font-medium">${serverDepositAmount.toLocaleString()}</div>
            </div>
            {clientDepositAmount !== serverDepositAmount && (
              <div className="mt-2 text-sm text-amber-700">Totals differ — the server amount will be used for checkout.</div>
            )}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onCancel} className="rounded-full px-4 py-2 text-sm border">Cancel</button>
          <button onClick={onConfirm} className="rounded-full bg-slate-900 px-4 py-2 text-sm text-white">Confirm and pay deposit</button>
        </div>
      </div>
    </div>
  );
}
