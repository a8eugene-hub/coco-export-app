"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, SectionTitle } from "@/components/ui";

type Props = {
  orderId: string;
  initialNotes: string;
};

export function OrderMemo({ orderId, initialNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [loading, setLoading] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ notes: notes.trim() ? notes : null }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "保存に失敗しました");
        return;
      }
      setSavedAt(new Date().toLocaleString());
      router.refresh();
    } catch {
      setError("保存に失敗しました（通信エラー）");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <SectionTitle>メモ</SectionTitle>
      <p className="mt-1 text-[11px] text-slate-500">EMS番号・連絡事項などを記入できます。</p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={6}
        placeholder={"例:\nEMS: EE123456789LK\n送付日: 2026-03-12\n備考: ..."}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs leading-relaxed text-slate-800 focus:border-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-400"
      />
      {error && <p className="mt-2 text-xs text-rose-600">{error}</p>}
      <div className="mt-2 flex items-center justify-between gap-2">
        <Button type="button" onClick={save} disabled={loading}>
          {loading ? "保存中..." : "保存"}
        </Button>
        {savedAt && <span className="text-[11px] text-slate-400">保存: {savedAt}</span>}
      </div>
    </Card>
  );
}

