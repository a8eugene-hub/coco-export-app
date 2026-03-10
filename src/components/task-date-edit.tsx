"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, StatusBadge } from "@/components/ui";

type Task = {
  id: string;
  scope: string;
  task_key?: string;
  title: string;
  status: string;
  planned_date: string | null;
  completed_date: string | null;
};

export function TaskDateEdit({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planned, setPlanned] = useState("");
  const [completed, setCompleted] = useState("");
  const [loading, setLoading] = useState(false);

  const statusLabel = (status: string) => {
    if (status === "COMPLETED" || status === "DONE") return "完了";
    if (status === "IN_PROGRESS") return "進行中";
    if (status === "NOT_STARTED") return "未着手";
    return status;
  };

  const titleLabel = (title: string) => {
    // 旧4工程の英語タイトルを日本語にマッピング
    if (title === "Order received") return "注文受領";
    if (title === "PO uploaded") return "注文書アップロード";
    if (title === "AI extracted") return "AI取込";
    if (title === "Order approved") return "注文承認";
    // それ以外はそのまま（10ステップ用タイトルなど）
    return title;
  };

  // 旧4工程（Order received / PO uploaded / AI extracted / Order approved）は
  // 新しい10ステップとは別なので、一覧表示から除外する
  const visibleTasks = tasks.filter(
    (t) =>
      ![
        "Order received",
        "PO uploaded",
        "AI extracted",
        "Order approved",
      ].includes(t.title) &&
      !["PRODUCTION_COMPLETED", "SHIPMENT_DONE"].includes(t.task_key ?? ""),
  );

  const ORDER_FLOW_KEYS = [
    "ORDER_CREATED",          // 注文書作成 / Order created
    "PROFORMA_ISSUED",        // Proforma Invoice
    "PRODUCTION_INSTRUCTED",  // 生産指示
    "VESSEL_BOOKED",          // 船ブッキング
    "BL_ISSUED",              // B/L発行
    "DOCUMENTS_SENT",         // 書類送付
    "PAYMENT_RECEIVED",       // 入金
    "ARRIVED_JAPAN",          // 日本到着
    "WPJ_FEE_PAID",           // WPJへの報酬支払い
  ];

  const sortedTasks = [...visibleTasks].sort((a, b) => {
    const ia = ORDER_FLOW_KEYS.indexOf(a.task_key ?? "");
    const ib = ORDER_FLOW_KEYS.indexOf(b.task_key ?? "");
    return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
  });

  function startEdit(t: Task) {
    setEditingId(t.id);
    setPlanned(t.planned_date ?? "");
    setCompleted(t.completed_date ?? "");
  }

  async function save() {
    if (!editingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tasks/${editingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          planned_date: planned || null,
          completed_date: completed || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        alert(json?.error ?? "更新に失敗しました");
        return;
      }
      setEditingId(null);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ul className="mt-2 space-y-2 text-xs">
      {sortedTasks.map((t) => (
        <li key={t.id} className="flex items-center justify-between rounded-lg border border-slate-100 p-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-900">{titleLabel(t.title)}</span>
              <StatusBadge label={statusLabel(t.status)} tone={t.completed_date ? "green" : "gray"} />
            </div>
            {editingId === t.id ? (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500">予定:</span>
                  <input
                    type="date"
                    value={planned}
                    onChange={(e) => setPlanned(e.target.value)}
                    className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                  />
                </label>
                <label className="flex items-center gap-1">
                  <span className="text-[11px] text-slate-500">完了:</span>
                  <input
                    type="date"
                    value={completed}
                    onChange={(e) => setCompleted(e.target.value)}
                    className="rounded border border-slate-200 px-2 py-1 text-[11px]"
                  />
                </label>
                <Button type="button" onClick={save} disabled={loading}>
                  {loading ? "保存中..." : "保存"}
                </Button>
                <Button type="button" variant="ghost" onClick={() => setEditingId(null)} disabled={loading}>
                  キャンセル
                </Button>
              </div>
            ) : (
              <div className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                <span>予定: {t.planned_date ?? "-"} / 完了: {t.completed_date ?? "-"}</span>
                <button
                  type="button"
                  onClick={() => startEdit(t)}
                  className="text-slate-400 hover:text-slate-700 underline"
                >
                  編集
                </button>
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
