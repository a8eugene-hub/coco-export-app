"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, SectionTitle } from "@/components/ui";

const DOC_TYPES = [
  { value: "PO", label: "PO" },
  { value: "PROFORMA", label: "Proforma" },
  { value: "COMMERCIAL_INVOICE", label: "Commercial Invoice" },
  { value: "PACKING_LIST", label: "Packing List" },
  { value: "BL", label: "B/L" },
  { value: "PHYTO", label: "Phyto" },
  { value: "COO", label: "COO" },
  { value: "FUMIGATION", label: "Fumigation" },
  { value: "PAYMENT_RECEIPT", label: "Payment Receipt" },
  { value: "OTHER", label: "Other" },
] as const;

type Doc = { id: string; document_type: string; file_name: string; uploaded_at: string };

type Props = {
  scope: "ORDER" | "SHIPMENT" | "PAYMENT";
  orderId: string;
  shipmentId?: string;
  paymentId?: string;
  title?: string;
};

export function DocumentList({ scope, orderId, shipmentId, paymentId, title }: Props) {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [docType, setDocType] = useState("OTHER");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const query = new URLSearchParams({ scope, order_id: orderId });
  if (shipmentId) query.set("shipment_id", shipmentId);
  if (paymentId) query.set("payment_id", paymentId);

  function load() {
    fetch(`/api/documents?${query}`)
      .then((r) => r.json())
      .then((data) => setDocs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  useEffect(() => load(), [scope, orderId, shipmentId, paymentId]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError("ファイルを選択してください");
      return;
    }
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.set("scope", scope);
    form.set("order_id", orderId);
    if (shipmentId) form.set("shipment_id", shipmentId);
    if (paymentId) form.set("payment_id", paymentId);
    form.set("document_type", docType);
    form.set("file", file);
    try {
      const res = await fetch("/api/documents", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "アップロードに失敗しました");
        return;
      }
      setFile(null);
      load();
      router.refresh();
    } catch (err) {
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>{title ?? "ドキュメント"}</SectionTitle>
      <form onSubmit={upload} className="mt-2 flex flex-wrap items-end gap-2">
        <select
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
          className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
        >
          {DOC_TYPES.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
        <input
          type="file"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs"
        />
        <Button type="submit" disabled={loading || !file}>{loading ? "送信中..." : "アップロード"}</Button>
      </form>
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <ul className="mt-3 space-y-1 text-xs">
        {docs.length === 0 && <li className="text-slate-500">書類がまだありません。</li>}
        {docs.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-2">
            <span className="text-slate-700">{d.document_type}: {d.file_name}</span>
            <a href={`/api/documents/${d.id}/download`} target="_blank" rel="noopener noreferrer" className="text-slate-600 hover:underline">
              ダウンロード
            </a>
          </li>
        ))}
      </ul>
    </Card>
  );
}
