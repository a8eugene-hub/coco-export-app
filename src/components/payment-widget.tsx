"use client";

import { useState } from "react";
import useSWR from "swr";

import { Button, StatusBadge } from "./ui";

type LedgerResponse = {
  payment: {
    id: string;
    payment_type: "PAYMENT1" | "PAYMENT2";
    status: "UNPAID" | "PARTIAL" | "PAID";
    currency: string;
    due_date: string | null;
  };
  latest_planned: number;
  paid_total: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
  revisions: {
    id: string;
    amount_planned: string;
    revised_at: string;
  }[];
  transactions: {
    id: string;
    amount_paid: string;
    paid_date: string;
  }[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function PaymentWidget({ paymentIds }: { paymentIds: string[] }) {
  const url = paymentIds.length ? `/api/payments/ledger?ids=${paymentIds.join(",")}` : null;
  const { data: ledgers, mutate } = useSWR<LedgerResponse[]>(url, fetcher);

  if (!paymentIds.length) return null;

  return (
    <div className="space-y-2">
      {ledgers?.map((l) => (
        <PaymentLedgerCard key={l.payment.id} ledger={l} onRecorded={() => mutate()} />
      ))}
    </div>
  );
}

function PaymentLedgerCard({ ledger: l, onRecorded }: { ledger: LedgerResponse; onRecorded: () => void }) {
  const [open, setOpen] = useState(false);
  const [paidDate, setPaidDate] = useState(new Date().toISOString().slice(0, 10));
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const num = Number(amount);
    if (!paidDate || isNaN(num) || num <= 0) {
      setError("入金日と金額を正しく入力してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/payments/${l.payment.id}/transactions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          paid_date: paidDate,
          amount_paid: num,
          currency: l.payment.currency,
          memo: memo || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "入金の記録に失敗しました");
        return;
      }
      setAmount("");
      setMemo("");
      setOpen(false);
      onRecorded();
    } catch (err) {
      console.error(err);
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-lg border border-slate-100 p-3 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{l.payment.payment_type}</span>
          <StatusBadge label={l.status} tone={statusTone(l.status)} />
        </div>
        <div className="text-[11px] text-slate-500">期日: {l.payment.due_date ?? "-"}</div>
      </div>
      <div className="mt-1 flex items-center justify-between text-[11px] text-slate-600">
        <span>
          予定合計: {l.latest_planned.toLocaleString()} {l.payment.currency}
        </span>
        <span>
          入金合計: {l.paid_total.toLocaleString()} {l.payment.currency}
        </span>
      </div>
      {!open ? (
        <Button variant="ghost" type="button" onClick={() => setOpen(true)} className="mt-2 text-[11px]">
          入金を記録
        </Button>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-2 border-t border-slate-100 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-600">入金日</label>
            <input
              type="date"
              value={paidDate}
              onChange={(e) => setPaidDate(e.target.value)}
              className="rounded border border-slate-200 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-600">金額 ({l.payment.currency})</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="例: 500"
              className="rounded border border-slate-200 px-2 py-1 text-[11px]"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] text-slate-600">メモ（任意）</label>
            <input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="rounded border border-slate-200 px-2 py-1 text-[11px]"
            />
          </div>
          {error && <p className="text-[11px] text-rose-600">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "記録中..." : "記録する"}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
              キャンセル
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function statusTone(status: LedgerResponse["status"]) {
  if (status === "PAID") return "green" as const;
  if (status === "PARTIAL") return "yellow" as const;
  return "red" as const;
}

