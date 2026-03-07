import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer, createServiceClient } from "@/lib/supabaseClient";
import { Card, SectionTitle, StatusBadge } from "@/components/ui";

type PaymentRow = {
  payment_type: "PAYMENT1" | "PAYMENT2";
  status: "UNPAID" | "PARTIAL" | "PAID";
};

export default async function OrdersPage() {
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // 一覧取得は SERVICE_ROLE があればそれで（デモデータと同一の権限で表示）
  const dataClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient()
    : authClient;
  const { data: orders } = await dataClient
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
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">注文一覧</h1>
          <p className="text-sm text-slate-600">Order / Payment1 / Payment2 のステータスを一覧します。</p>
        </div>
      </header>

      <Card>
        <SectionTitle>Orders</SectionTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
            <thead className="text-[11px] text-slate-500">
              <tr>
                <th className="px-3 py-1">Order No</th>
                <th className="px-3 py-1">顧客</th>
                <th className="px-3 py-1">目的地</th>
                <th className="px-3 py-1">Payment1</th>
                <th className="px-3 py-1">Payment2</th>
                <th className="px-3 py-1">更新日</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-xs text-slate-500">
                    まだOrderがありません。
                  </td>
                </tr>
              )}
              {rows.map((o) => (
                <tr key={o.id} className="rounded-lg bg-white shadow-sm">
                  <td className="px-3 py-2">
                    <a href={`/orders/${o.id}`} className="font-medium text-slate-900 hover:underline">
                      {o.order_no}
                    </a>
                  </td>
                  <td className="px-3 py-2">{o.customers?.name}</td>
                  <td className="px-3 py-2">{o.destination}</td>
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
                  <td className="px-3 py-2 text-slate-500">{o.updated_at?.slice(0, 10)}</td>
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

