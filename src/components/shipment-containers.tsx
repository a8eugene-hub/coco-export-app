"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Input, SectionTitle } from "@/components/ui";

type Container = { id: string; container_no: string | null; seal_no: string | null };

export function ShipmentContainers({ shipmentId }: { shipmentId: string }) {
  const router = useRouter();
  const [containers, setContainers] = useState<Container[]>([]);
  const [open, setOpen] = useState(false);
  const [containerNo, setContainerNo] = useState("");
  const [sealNo, setSealNo] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    fetch(`/api/shipments/${shipmentId}/containers`)
      .then((r) => r.json())
      .then((data) => setContainers(Array.isArray(data) ? data : []))
      .catch(() => {});
  }

  useEffect(() => load(), [shipmentId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/shipments/${shipmentId}/containers`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ container_no: containerNo || null, seal_no: sealNo || null }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json?.error ?? "登録に失敗しました");
        return;
      }
      setContainerNo("");
      setSealNo("");
      setOpen(false);
      load();
      router.refresh();
    } catch (err) {
      alert("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function remove(id: string) {
    if (!confirm("このコンテナを削除しますか？この操作は取り消せません。")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/containers/${id}`, { method: "DELETE" });
      if (!res.ok) return;
      load();
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <SectionTitle>コンテナ情報</SectionTitle>
        {!open && (
          <Button variant="secondary" type="button" onClick={() => setOpen(true)}>
            + コンテナを追加
          </Button>
        )}
      </div>
      {open && (
        <form onSubmit={add} className="mt-3 space-y-2 border-t border-slate-100 pt-3">
          <Input label="Container No" value={containerNo} onChange={setContainerNo} placeholder="例: ABCD1234567" />
          <Input label="Seal No" value={sealNo} onChange={setSealNo} placeholder="例: S001" />
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>{loading ? "追加中..." : "追加"}</Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={loading}>キャンセル</Button>
          </div>
        </form>
      )}
      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead className="text-[11px] text-slate-500">
            <tr><th className="px-2 py-1 text-left">Container No</th><th className="px-2 py-1 text-left">Seal No</th><th className="w-12"></th></tr>
          </thead>
          <tbody>
            {containers.length === 0 && (
              <tr><td colSpan={3} className="px-2 py-2 text-slate-500">コンテナがまだ登録されていません。</td></tr>
            )}
            {containers.map((c) => (
              <tr key={c.id} className="border-t border-slate-100">
                <td className="px-2 py-2">{c.container_no ?? "-"}</td>
                <td className="px-2 py-2">{c.seal_no ?? "-"}</td>
                <td className="px-2 py-2">
                  <button type="button" onClick={() => remove(c.id)} className="text-rose-600 hover:underline text-[11px]">削除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
