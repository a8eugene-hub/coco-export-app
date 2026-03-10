"use client";

import { useEffect, useState } from "react";

type Props = {
  orderId: string;
};

type ProformaTextResponse = {
  order_id: string;
  document_id: string;
  file_name: string;
  text: string;
  error?: string;
};

export function OrderProformaSideBySide({ orderId }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [text, setText] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/orders/${orderId}/proforma-text`);
        const json = (await res.json()) as ProformaTextResponse;
        if (!res.ok || json.error) {
          if (!cancelled) setError(json.error ?? "PROFORMAの読み込みに失敗しました");
          return;
        }
        if (!cancelled) {
          setText(json.text ?? "");
          setFileName(json.file_name ?? null);
        }
      } catch {
        if (!cancelled) setError("PROFORMAの読み込みに失敗しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="mt-2 text-[11px] text-slate-500">
        PROFORMAを読み込み中...
      </div>
    );
  }

  if (error || !text) {
    return (
      <div className="mt-2 text-[11px] text-slate-500">
        PROFORMAがアップロードされていないか、読み込みに失敗しました。
        {error && <span className="ml-1 text-[10px] text-rose-500">({error})</span>}
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-700">Proforma Invoice 内容</span>
        {fileName && <span className="text-[11px] text-slate-500">{fileName}</span>}
      </div>
      <div className="max-h-64 overflow-auto rounded-md bg-white p-2 text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap">
        {text}
      </div>
    </div>
  );
}

