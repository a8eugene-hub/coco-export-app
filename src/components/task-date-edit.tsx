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

type Props = {
  tasks: Task[];
  paymentIds?: string[];
};

type LedgerResponse = {
  payment: {
    id: string;
    payment_type: "PAYMENT1" | "PAYMENT2";
    status: "UNPAID" | "PARTIAL" | "PAID";
    currency: string;
    due_date: string | null;
  };
  latest_planned: number;
  paid_total: number;
  status: "UNPAID" | "PARTIAL" | "PAID";
};

export function TaskDateEdit({ tasks, paymentIds }: Props) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [planned, setPlanned] = useState("");
  const [completed, setCompleted] = useState("");
  const [loading, setLoading] = useState(false);
  const [paymentLedgers, setPaymentLedgers] = useState<LedgerResponse[] | null>(null);
  const [paymentAmounts, setPaymentAmounts] = useState<Record<"PAYMENT1" | "PAYMENT2", string>>({
    PAYMENT1: "",
    PAYMENT2: "",
  });

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

  async function maybeLoadPaymentLedgers() {
    if (!paymentIds || !paymentIds.length || paymentLedgers) return;
    try {
      const res = await fetch(`/api/payments/ledger?ids=${paymentIds.join(",")}`);
      const json = (await res.json()) as LedgerResponse[];
      setPaymentLedgers(json);
      setPaymentAmounts((prev) => {
        const next = { ...prev };
        const p1 = json.find((l) => l.payment.payment_type === "PAYMENT1");
        const p2 = json.find((l) => l.payment.payment_type === "PAYMENT2");
        if (p1 && !next.PAYMENT1 && p1.latest_planned) {
          next.PAYMENT1 = String(p1.latest_planned);
        }
        if (p2 && !next.PAYMENT2 && p2.latest_planned) {
          next.PAYMENT2 = String(p2.latest_planned);
        }
        return next;
      });
    } catch {
      // 失敗してもタスク側の保存はできるようにする
    }
  }

  async function startEdit(t: Task) {
    setEditingId(t.id);
    setPlanned(t.planned_date ?? "");
    setCompleted(t.completed_date ?? "");
    if (t.task_key === "PAYMENT_RECEIVED" || t.task_key === "WPJ_FEE_PAID") {
      await maybeLoadPaymentLedgers();
    }
  }

  function ledgerForTask(taskKey?: string) {
    if (!paymentLedgers) return null;
    if (taskKey === "PAYMENT_RECEIVED") {
      return paymentLedgers.find((l) => l.payment.payment_type === "PAYMENT1") ?? null;
    }
    if (taskKey === "WPJ_FEE_PAID") {
      return paymentLedgers.find((l) => l.payment.payment_type === "PAYMENT2") ?? null;
    }
    return null;
  }

  async function save() {
    if (!editingId) return;
    setLoading(true);
    try {
      const currentTask = visibleTasks.find((t) => t.id === editingId);

      // 入金ステップのときは対応する Payment にも入金を記録する
      if (
        (currentTask?.task_key === "PAYMENT_RECEIVED" || currentTask?.task_key === "WPJ_FEE_PAID") &&
        paymentLedgers
      ) {
        const targetType = currentTask.task_key === "WPJ_FEE_PAID" ? "PAYMENT2" : "PAYMENT1";
        const ledger = paymentLedgers.find((l) => l.payment.payment_type === targetType);
        const rawAmount = paymentAmounts[targetType];
        const num = Number(rawAmount);
        const paidDate = completed || planned || new Date().toISOString().slice(0, 10);
        if (ledger && !isNaN(num) && num > 0) {
          const resPay = await fetch(`/api/payments/${ledger.payment.id}/transactions`, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              paid_date: paidDate,
              amount_paid: num,
              currency: ledger.payment.currency,
            }),
          });
          if (!resPay.ok) {
            const j = await resPay.json();
            alert(j?.error ?? "入金の記録に失敗しました");
          }
        }
      }

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
              <div className="mt-2 flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
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
                </div>
                {["PAYMENT_RECEIVED", "WPJ_FEE_PAID"].includes(t.task_key ?? "") && (
                  (() => {
                    const ledger = ledgerForTask(t.task_key);
                    if (!ledger) return null;
                    const type =
                      t.task_key === "WPJ_FEE_PAID" ? ("PAYMENT2" as const) : ("PAYMENT1" as const);
                    const labelPrefix =
                      t.task_key === "WPJ_FEE_PAID" ? "WPJ報酬額" : "入金金額";
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500">
                            {labelPrefix} ({ledger.payment.currency})
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={paymentAmounts[type]}
                            onChange={(e) =>
                              setPaymentAmounts((prev) => ({ ...prev, [type]: e.target.value }))
                            }
                            className="w-32 rounded border border-slate-200 px-2 py-1 text-[11px]"
                          />
                        </label>
                        <span className="text-[11px] text-slate-500">
                          予定額: {ledger.latest_planned.toLocaleString()} {ledger.payment.currency}
                        </span>
                      </div>
                    );
                  })()
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <Button type="button" onClick={save} disabled={loading}>
                    {loading ? "保存中..." : "保存"}
                  </Button>
                  <Button type="button" variant="ghost" onClick={() => setEditingId(null)} disabled={loading}>
                    キャンセル
                  </Button>
                </div>
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
