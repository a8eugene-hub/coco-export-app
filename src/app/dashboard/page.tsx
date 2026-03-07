import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabaseClient";
import { Card, SectionTitle, StatusBadge } from "@/components/ui";
import { SeedButton } from "@/components/seed-button";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: delayedTasks }, { data: upcomingShipments }, { data: recentOrders }] = await Promise.all([
    supabase
      .from("tasks")
      .select("*, orders(order_no), shipments(bl_no)")
      .lt("planned_date", today)
      .is("completed_date", null)
      .order("planned_date", { ascending: true })
      .limit(10),
    supabase
      .from("shipments")
      .select("*")
      .gte("etd", today)
      .lte("etd", addDays(today, 7))
      .order("etd", { ascending: true }),
    supabase
      .from("orders")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(10),
  ]);

  const delayed = delayedTasks ?? [];
  const upcoming = upcomingShipments ?? [];
  const recent = recentOrders ?? [];

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">ダッシュボード</h1>
          <p className="text-sm text-slate-600">遅延タスク・今週の出荷・最近の案件を確認します。</p>
        </div>
        <div className="flex items-center gap-3">
          <SeedButton />
          <Link
            href="/orders"
            className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            注文一覧へ
          </Link>
        </div>
      </header>

      <main className="grid gap-4 md:grid-cols-3">
        <Card>
          <SectionTitle>遅延タスク</SectionTitle>
          <p className="mt-1 text-xs text-slate-500">
            planned_date &lt; 今日 かつ completed_date が未入力のタスク。
          </p>
          <ul className="mt-3 space-y-2">
            {delayed.length === 0 && <li className="text-xs text-slate-500">遅延タスクはありません。</li>}
            {delayed.map((t) => (
              <li key={t.id} className="rounded-lg border border-slate-100 p-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-slate-800">{t.title}</span>
                  <StatusBadge label={t.status} tone="red" />
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>予定日: {t.planned_date}</span>
                  {"orders" in t && t.orders && <span>Order: {t.orders.order_no}</span>}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>今週ETD</SectionTitle>
          <p className="mt-1 text-xs text-slate-500">今週出港予定の Shipment。</p>
          <ul className="mt-3 space-y-2 text-xs">
            {upcoming.length === 0 && <li className="text-slate-500">今週ETDのShipmentはありません。</li>}
            {upcoming.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-100 p-2">
                <div className="flex items-center justify-between gap-2">
                  <a href={`/shipments/${s.id}`} className="font-medium text-slate-800 hover:underline">
                    {s.bl_no || "BL未確定"}
                  </a>
                  <span>{s.etd}</span>
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  ETA {s.eta} / {s.container_count} x {s.container_type}
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <SectionTitle>直近更新のOrder</SectionTitle>
          <ul className="mt-3 space-y-2 text-xs">
            {recent.length === 0 && <li className="text-slate-500">まだOrderがありません。</li>}
            {recent.map((o) => (
              <li key={o.id} className="rounded-lg border border-slate-100 p-2">
                <div className="flex items-center justify-between gap-2">
                  <a href={`/orders/${o.id}`} className="font-medium text-slate-800 hover:underline">
                    {o.order_no}
                  </a>
                  <span>{o.destination}</span>
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{o.incoterms}</span>
                  <span>更新: {o.updated_at?.slice(0, 10)}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </main>
    </div>
  );
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

