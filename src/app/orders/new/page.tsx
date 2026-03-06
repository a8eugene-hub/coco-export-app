"use client";

import { useState } from "react";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

export default function NewOrderPage() {
  const [orderNo, setOrderNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [destination, setDestination] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_no: orderNo,
          customer_name: customerName,
          destination,
          incoterms,
          currency,
          order_date: new Date().toISOString().slice(0, 10),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error ?? "作成に失敗しました");
        return;
      }
      window.location.href = "/orders";
    } catch (e) {
      console.error(e);
      setMessage("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <SectionTitle>注文を作成</SectionTitle>
        <p className="mt-1 text-sm text-slate-600">ここだけ入力すれば、まず運用を始められます。</p>
        <div className="mt-4 grid gap-3">
          <Input label="Order No" value={orderNo} onChange={setOrderNo} placeholder="例: CO/AR-03-06" required />
          <Input label="顧客名" value={customerName} onChange={setCustomerName} placeholder="例: SAMPLE" required />
          <Input label="目的地" value={destination} onChange={setDestination} placeholder="例: YOKOHAMA" />
          <Input label="Incoterms" value={incoterms} onChange={setIncoterms} placeholder="例: CIF Yokohama" />
          <Input label="通貨" value={currency} onChange={setCurrency} placeholder="例: USD" />
        </div>
        {message && <p className="mt-3 text-sm text-rose-600">{message}</p>}
        <div className="mt-5 flex items-center gap-2">
          <Button onClick={submit} disabled={loading}>
            {loading ? "作成中..." : "作成する"}
          </Button>
          <Button variant="ghost" onClick={() => (window.location.href = "/orders")} disabled={loading}>
            キャンセル
          </Button>
        </div>
      </Card>
    </div>
  );
}

