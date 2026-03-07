"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

export function ShipmentAddForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [blNo, setBlNo] = useState("");
  const [etd, setEtd] = useState("");
  const [eta, setEta] = useState("");
  const [vesselName, setVesselName] = useState("");
  const [voyageNo, setVoyageNo] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/shipments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          bl_no: blNo || null,
          etd: etd || null,
          eta: eta || null,
          vessel_name: vesselName || null,
          voyage_no: voyageNo || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Shipmentの作成に失敗しました");
        return;
      }
      setBlNo("");
      setEtd("");
      setEta("");
      setVesselName("");
      setVoyageNo("");
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
      <Button variant="secondary" onClick={() => setOpen(true)} type="button">
        + Shipmentを追加
      </Button>
    );
  }

  return (
    <Card>
      <SectionTitle>Shipmentを追加</SectionTitle>
      <form onSubmit={submit} className="mt-3 space-y-3">
        <Input label="B/L No" value={blNo} onChange={setBlNo} placeholder="例: BL-001" />
        <Input label="ETD" value={etd} onChange={setEtd} type="date" placeholder="出港予定日" />
        <Input label="ETA" value={eta} onChange={setEta} type="date" placeholder="到着予定日" />
        <Input label="船名" value={vesselName} onChange={setVesselName} placeholder="例: EVER GIVEN" />
        <Input label="Voyage No" value={voyageNo} onChange={setVoyageNo} placeholder="例: 012E" />
        {error && <p className="text-xs text-rose-600">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "作成中..." : "作成する"}
          </Button>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>
            キャンセル
          </Button>
        </div>
      </form>
    </Card>
  );
}
