"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Props = {
  shipmentId: string;
  initial: { bl_no: string; etd: string; eta: string };
};

export function ShipmentEditForm({ shipmentId, initial }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blNo, setBlNo] = useState(initial.bl_no ?? "");
  const [etd, setEtd] = useState(initial.etd?.slice(0, 10) ?? "");
  const [eta, setEta] = useState(initial.eta?.slice(0, 10) ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bl_no: blNo || null,
          etd: etd || null,
          eta: eta || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "更新に失敗しました");
        return;
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <Button variant="secondary" type="button" onClick={() => setOpen(true)}>
        B/L・ETD/ETA を編集
      </Button>
    );
  }

  return (
    <Card>
      <SectionTitle>B/L・ETD/ETA を編集</SectionTitle>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <Input label="B/L No" value={blNo} onChange={setBlNo} placeholder="例: BL-001" />
        <Input label="ETD" value={etd} onChange={setEtd} type="date" />
        <Input label="ETA" value={eta} onChange={setEta} type="date" />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "保存中..." : "保存"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
        </div>
      </form>
    </Card>
  );
}
