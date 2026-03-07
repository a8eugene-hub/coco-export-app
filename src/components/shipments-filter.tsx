"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ShipmentsFilter({ initialFrom, initialTo }: { initialFrom?: string; initialTo?: string }) {
  const router = useRouter();
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");

  function apply() {
    const p = new URLSearchParams();
    if (from) p.set("etd_from", from);
    if (to) p.set("etd_to", to);
    router.push(`/shipments?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-100 bg-white p-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-slate-600">ETD から</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-slate-600">ETD まで</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
      </label>
      <button type="button" onClick={apply} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
        検索
      </button>
    </div>
  );
}
