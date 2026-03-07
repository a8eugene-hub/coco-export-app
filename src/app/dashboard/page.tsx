import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClientServer, createServiceClient } from "@/lib/supabaseClient";
import { Card, SectionTitle, StatusBadge } from "@/components/ui";
import { SeedButton } from "@/components/seed-button";

type PageProps = { searchParams: Promise<{ delayed_filter?: string }> };

export default async function DashboardPage({ searchParams }: PageProps) {
  const cookieStore = await cookies();
  const authClient = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const dataClient = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? createServiceClient()
    : authClient;
  const today = new Date().toISOString().slice(0, 10);
  const delayedFilter = (await searchParams).delayed_filter ?? "overdue";
  const weekStart = addDays(today, -6);

  let delayedQuery = dataClient
    .from("tasks")
    .select("*, orders(order_no), shipments(bl_no)")
    .is("completed_date", null)
    .order("planned_date", { ascending: true })
    .limit(50);
  if (delayedFilter === "today") {
    delayedQuery = delayedQuery.eq("planned_date", today);
  } else if (delayedFilter === "week") {
    delayedQuery = delayedQuery.gte("planned_date", weekStart).lte("planned_date", today);
  } else {
    delayedQuery = delayedQuery.lt("planned_date", today);
  }

  const [{ data: delayedTasks }, { data: upcomingShipments }, { data: recentOrders }] = await Promise.all([
    delayedQuery,
    dataClient
      .from("shipments")
      .select("*")
      .gte("etd", today)
      .lte("etd", addDays(today, 7))
      .order("etd", { ascending: true }),
    dataClient
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>遅延タスク</SectionTitle>
            <div className="flex gap-1 text-[11px]">
              <a href="?delayed_filter=overdue" className={`rounded px-2 py-1 ${delayedFilter === "overdue" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>期限超過</a>
              <a href="?delayed_filter=week" className={`rounded px-2 py-1 ${delayedFilter === "week" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>今週</a>
              <a href="?delayed_filter=today" className={`rounded px-2 py-1 ${delayedFilter === "today" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>今日</a>
            </div>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            completed_date が未入力のタスク（フィルタで表示を切り替え）。
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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionTitle>今週ETD</SectionTitle>
            <Link
              href="/shipments"
              className="text-xs font-medium text-slate-600 hover:text-slate-900 hover:underline"
            >
              Shipment一覧へ →
            </Link>
          </div>
          <p className="mt-1 text-xs text-slate-500">今週出港予定の Shipment。</p>
          <ul className="mt-3 space-y-2 text-xs">
            {upcoming.length === 0 && <li className="text-slate-500">今週ETDのShipmentはありません。</li>}
            {upcoming.map((s) => (
              <li key={s.id} className="rounded-lg border border-slate-100 p-2">
                <div className="flex items-center justify-between gap-2">
                  <Link href={`/shipments/${s.id}`} className="font-medium text-slate-800 hover:underline">
                    {s.bl_no || "BL未確定"}
                  </Link>
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

