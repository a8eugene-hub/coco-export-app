"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Props = {
  orderId: string;
  orderNo: string;
  initial: {
    proforma_no: string;
    destination: string;
    incoterms: string;
    currency: string;
    notes: string;
    order_date: string;
  };
};

export function OrderEditForm({ orderId, orderNo, initial }: Props) {
  const router = useRouter();
  const [proformaNo, setProformaNo] = useState(initial.proforma_no ?? "");
  const [destination, setDestination] = useState(initial.destination ?? "");
  const [incoterms, setIncoterms] = useState(initial.incoterms ?? "");
  const [currency, setCurrency] = useState(initial.currency ?? "USD");
  const [notes, setNotes] = useState(initial.notes ?? "");
  const [orderDate, setOrderDate] = useState(initial.order_date?.slice(0, 10) ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          proforma_no: proformaNo || null,
          destination: destination || null,
          incoterms: incoterms || null,
          currency: currency || "USD",
          notes: notes || null,
          order_date: orderDate || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "更新に失敗しました");
        return;
      }
      router.push(`/orders/${orderId}`);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>注文を編集</SectionTitle>
      <p className="mt-1 text-xs text-slate-500">Order No: {orderNo}（変更不可）</p>
      <form onSubmit={submit} className="mt-4 space-y-3">
        <Input label="発注日" value={orderDate} onChange={setOrderDate} type="date" />
        <Input label="プロフォーマ番号" value={proformaNo} onChange={setProformaNo} placeholder="例: PF-2024-001" />
        <Input label="目的地" value={destination} onChange={setDestination} placeholder="例: YOKOHAMA" />
        <Input label="Incoterms" value={incoterms} onChange={setIncoterms} placeholder="例: CIF Yokohama" />
        <Input label="通貨" value={currency} onChange={setCurrency} placeholder="USD" />
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">備考</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
        </div>
        {error && <p className="text-sm text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => router.back()} disabled={loading}>
            キャンセル
          </Button>
        </div>
      </form>
    </Card>
  );
}
