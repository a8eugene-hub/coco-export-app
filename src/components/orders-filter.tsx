"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function OrdersFilter({ initialQ, initialFrom, initialTo }: { initialQ?: string; initialFrom?: string; initialTo?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [q, setQ] = useState(initialQ ?? "");
  const [from, setFrom] = useState(initialFrom ?? "");
  const [to, setTo] = useState(initialTo ?? "");

  function apply() {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (from) p.set("from", from);
    if (to) p.set("to", to);
    router.push(`/orders?${p.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-100 bg-white p-3">
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-slate-600">Order No・目的地など</span>
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="検索..."
          className="w-40 rounded border border-slate-200 px-2 py-1.5 text-sm"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-slate-600">発注日 から</span>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
      </label>
      <label className="flex flex-col gap-1 text-xs">
        <span className="text-slate-600">発注日 まで</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded border border-slate-200 px-2 py-1.5 text-sm" />
      </label>
      <button type="button" onClick={apply} className="rounded-lg bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800">
        検索
      </button>
    </div>
  );
}
