"use client";

import useSWR from "swr";

import { StatusBadge } from "./ui";

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
  const { data: ledgers } = useSWR<LedgerResponse[]>(
    paymentIds.length ? `/api/payments/ledger?ids=${paymentIds.join(",")}` : null,
    fetcher,
  );

  if (!paymentIds.length) return null;

  return (
    <div className="space-y-2">
      {ledgers?.map((l) => (
        <div key={l.payment.id} className="rounded-lg border border-slate-100 p-3 text-xs">
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
        </div>
      ))}
    </div>
  );
}

function statusTone(status: LedgerResponse["status"]) {
  if (status === "PAID") return "green" as const;
  if (status === "PARTIAL") return "yellow" as const;
  return "red" as const;
}

