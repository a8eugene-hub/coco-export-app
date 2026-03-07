"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Customer = { id: string; name: string | null };
type Extracted = {
  order_no?: string | null;
  proforma_no?: string | null;
  order_date?: string | null;
  customer_name?: string | null;
  destination?: string | null;
  incoterms?: string | null;
  currency?: string;
  notes?: string | null;
  [key: string]: unknown;
};

function NewOrderForm() {
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draft");

  const [orderNo, setOrderNo] = useState("");
  const [proformaNo, setProformaNo] = useState("");
  const [customerId, setCustomerId] = useState<string>("");
  const [customerName, setCustomerName] = useState("");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [destination, setDestination] = useState("");
  const [incoterms, setIncoterms] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [draftInfo, setDraftInfo] = useState<{ file_name: string; view_url: string | null } | null>(null);

  useEffect(() => {
    fetch("/api/customers")
      .then((r) => r.json())
      .then((data) => setCustomers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!draftId) return;
    fetch(`/api/orders/draft-uploads/${draftId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        const ext = (data.extracted_data ?? {}) as Extracted;
        if (ext.order_no) setOrderNo(String(ext.order_no));
        if (ext.proforma_no) setProformaNo(String(ext.proforma_no));
        if (ext.order_date) setOrderDate(String(ext.order_date).slice(0, 10));
        if (ext.customer_name) setCustomerName(String(ext.customer_name));
        if (ext.destination) setDestination(String(ext.destination));
        if (ext.incoterms) setIncoterms(String(ext.incoterms));
        if (ext.currency) setCurrency(String(ext.currency));
        if (ext.notes) setNotes(String(ext.notes));
        setDraftInfo({ file_name: data.file_name ?? "", view_url: data.view_url ?? null });
      })
      .catch(() => {});
  }, [draftId]);

  async function submit() {
    if (!customerId && !customerName.trim()) {
      setMessage("既存顧客を選択するか、顧客名を入力してください");
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const order_date = orderDate || new Date().toISOString().slice(0, 10);
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
          order_date,
          notes: notes || null,
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
        <p className="mt-1 text-sm text-slate-600">Order No・顧客・目的地等を入力します。内容を確認のうえ「作成する」を押してください。</p>
        {draftInfo && (
          <p className="mt-2 flex items-center gap-2 text-xs text-slate-600">
            <span>読み込み元: {draftInfo.file_name}</span>
            {draftInfo.view_url ? (
              <a href={draftInfo.view_url} target="_blank" rel="noopener noreferrer" className="font-medium text-slate-900 underline hover:no-underline">
                PDFを見る
              </a>
            ) : null}
          </p>
        )}
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
          <div>
            <label className="block text-xs font-medium text-slate-700">注文日</label>
            <input
              type="date"
              value={orderDate}
              onChange={(e) => setOrderDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>
          <Input label="目的地" value={destination} onChange={setDestination} placeholder="例: YOKOHAMA" />
          <Input label="Incoterms" value={incoterms} onChange={setIncoterms} placeholder="例: CIF Yokohama" />
          <Input label="通貨" value={currency} onChange={setCurrency} placeholder="例: USD" />
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">備考（サイズ・重量・価格・コンテナ等）</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
              placeholder="PDFから読み込んだ詳細はここに入ります"
            />
          </div>
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

export default function NewOrderPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl p-4 text-sm text-slate-500">読み込み中...</div>}>
      <NewOrderForm />
    </Suspense>
  );
}
