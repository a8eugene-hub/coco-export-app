"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";

export function OrderDeleteButton({ orderId, orderNo }: { orderId: string; orderNo: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!confirm(`注文 ${orderNo} を削除しますか？\n関連する Shipment・タスク・Payment も削除されます。`)) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        alert(json?.error ?? "削除に失敗しました");
        return;
      }
      router.push("/orders");
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button variant="ghost" onClick={handleDelete} disabled={loading} className="text-rose-600 hover:bg-rose-50 hover:text-rose-700">
      {loading ? "削除中..." : "削除"}
    </Button>
  );
}
