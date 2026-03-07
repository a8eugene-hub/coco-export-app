"use client";

import { useEffect, useState } from "react";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Customer = { id: string; name: string | null };

export default function NewOrderPage() {
  const [orderNo, setOrderNo] = useState("");
  const [proformaNo, setProformaNo] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [destination, setDestination] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function submit() {
    if (!customerId && !customerName.trim()) {
      setMessage("既存顧客を選択するか、顧客名を入力してください");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          order_no: orderNo,
          proforma_no: proformaNo || null,
          customer_id: customerId || null,
          customer_name: customerId ? undefined : customerName.trim(),
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
        <p className="mt-1 text-sm text-slate-600">Order No・顧客・目的地等を入力します。</p>
        <div className="mt-4 grid gap-3">
          <Input label="Order No" value={orderNo} onChange={setOrderNo} placeholder="例: CO/AR-03-06" required />
          <Input label="プロフォーマ番号" value={proformaNo} onChange={setProformaNo} placeholder="例: PF-2024-001" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">既存顧客を選択</label>
            <select
              value={customerId}
              onChange={(e) => {
                setCustomerId(e.target.value);
                if (e.target.value) setCustomerName("");
              }}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="">— 新規で顧客名を入力 —</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name ?? c.id}</option>
              ))}
            </select>
          </div>
          {!customerId && (
            <Input label="顧客名（新規）" value={customerName} onChange={setCustomerName} placeholder="例: SAMPLE" />
          )}
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

