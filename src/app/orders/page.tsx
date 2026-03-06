import Link from "next/link";
import { createServiceClient } from "@/lib/supabaseClient";
import { Card, SectionTitle, StatusBadge } from "@/components/ui";

type PaymentRow = {
  payment_type: "PAYMENT1" | "PAYMENT2";
  status: "UNPAID" | "PARTIAL" | "PAID";
};

export default async function OrdersPage() {
  const supabase = createServiceClient();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, customers(name), payments(payment_type,status)")
    .order("created_at", { ascending: false })
    .limit(50);

  const rows =
    orders?.map((o) => {
      const payments = (o.payments ?? []) as PaymentRow[];
      const p1 = payments.find((p) => p.payment_type === "PAYMENT1");
      const p2 = payments.find((p) => p.payment_type === "PAYMENT2");
      return { ...o, payment1: p1, payment2: p2 };
    }) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">注文一覧</h1>
          <p className="text-sm text-slate-600">Order / Payment1 / Payment2 のステータスを一覧します。</p>
        </div>
        <Link
          href="/orders/new"
          className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          注文を作成
        </Link>
      </header>

      <Card>
        <SectionTitle>Orders</SectionTitle>
        <p className="mt-1 text-xs text-slate-600">
          文字が薄く見えにくい場合があったため、一覧のコントラストを強めています。
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-1 text-left text-sm">
            <thead className="text-xs text-slate-800">
              <tr>
                <th className="px-3 py-2">Order No</th>
                <th className="px-3 py-2">顧客</th>
                <th className="px-3 py-2">目的地</th>
                <th className="px-3 py-2">Payment1</th>
                <th className="px-3 py-2">Payment2</th>
                <th className="px-3 py-2">更新日</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-sm text-slate-600">
                    まだOrderがありません。
                  </td>
                </tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="rounded-lg bg-white text-slate-900 shadow-sm">
                  <td className="px-3 py-2 font-semibold">
                    <a href={`/orders/${o.id}`} className="hover:underline">
                      {o.order_no}
                    </a>
                  </td>
                  <td className="px-3 py-2">{o.customers?.name ?? "-"}</td>
                  <td className="px-3 py-2">{o.destination ?? "-"}</td>
                  <td className="px-3 py-2">
                    {o.payment1 && (
                      <StatusBadge
                        label={`P1: ${o.payment1.status}`}
                        tone={statusTone(o.payment1.status)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2">
                    {o.payment2 && (
                      <StatusBadge
                        label={`P2: ${o.payment2.status}`}
                        tone={statusTone(o.payment2.status)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-700">{o.updated_at?.slice(0, 10) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function statusTone(status: PaymentRow["status"]) {
  if (status === "PAID") return "green" as const;
  if (status === "PARTIAL") return "yellow" as const;
  return "red" as const;
}

