import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer, createServiceClient } from "@/lib/supabaseClient";
import { Card, SectionTitle } from "@/components/ui";

export default async function ShipmentsPage() {
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) redirect("/login");

  const dataClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? createServiceClient() : authClient;
  const { data: shipments } = await dataClient
    .from("shipments")
    .select("id, order_id, bl_no, etd, eta, container_type, container_count, orders(order_no)")
    .order("etd", { ascending: false })
    .limit(100);

  const list = shipments ?? [];

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Shipment一覧</h1>
          <p className="text-sm text-slate-600">ETD・ETA で並んだ出荷一覧です。</p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          ダッシュボードへ
        </Link>
      </header>

      <Card>
        <SectionTitle>Shipments</SectionTitle>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-1 text-left text-xs">
            <thead className="text-[11px] text-slate-500">
              <tr>
                <th className="px-3 py-1">B/L No</th>
                <th className="px-3 py-1">Order</th>
                <th className="px-3 py-1">ETD</th>
                <th className="px-3 py-1">ETA</th>
                <th className="px-3 py-1">コンテナ</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-3 text-center text-slate-500">
                    Shipmentがありません。
                  </td>
                </tr>
              )}
              {list.map((s) => (
                <tr key={s.id} className="rounded-lg bg-white shadow-sm">
                  <td className="px-3 py-2">
                    <Link href={`/shipments/${s.id}`} className="font-medium text-slate-900 hover:underline">
                      {s.bl_no || "BL未確定"}
                    </Link>
                  </td>
                  <td className="px-3 py-2">
                    {s.order_id && (
                      <Link href={`/orders/${s.order_id}`} className="text-slate-700 hover:underline">
                        {s.orders && typeof s.orders === "object" && "order_no" in s.orders
                          ? (s.orders as { order_no: string }).order_no
                          : s.order_id.slice(0, 8)}
                      </Link>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{s.etd ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{s.eta ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-500">
                    {s.container_count ?? 0} x {s.container_type ?? "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
