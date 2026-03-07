import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
type OrderTask = {
  id: string;
  scope: "ORDER" | "SHIPMENT";
  title: string;
  status: string;
  planned_date: string | null;
  completed_date: string | null;
  shipment_id: string | null;
};

type Shipment = {
  id: string;
  bl_no: string | null;
  etd: string | null;
  eta: string | null;
};

type Payment = {
  id: string;
};

type OrderDetail = {
  id: string;
  order_no: string;
  destination: string | null;
  incoterms: string | null;
  customers: { name: string | null } | null;
  shipments: Shipment[];
  payments: Payment[];
  tasks: OrderTask[];
};
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabaseClient";
import { Card, ProgressBar, SectionTitle, StatusBadge } from "@/components/ui";
import { PaymentWidget } from "@/components/payment-widget";
import { ShipmentAddForm } from "@/components/shipment-add-form";
import { TaskDateEdit } from "@/components/task-date-edit";

type Params = { params: Promise<{ id: string }> };

export default async function OrderDetailPage({ params }: Params) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: order } = await fetchOrderWithRelations(supabase, id);
  if (!order) {
    redirect("/orders");
  }

  const orderTasks = (order.tasks ?? []).filter((t) => t.scope === "ORDER");
  const shipmentTasks = (order.tasks ?? []).filter((t) => t.scope === "SHIPMENT");
  const shipments = order.shipments ?? [];
  const payments = order.payments ?? [];
  const paymentIds = payments.map((p) => p.id);

  const shipmentProgress = shipments.map((s) => {
    const tasksForShipment = shipmentTasks.filter((t) => t.shipment_id === s.id);
    const completed = tasksForShipment.filter((t) => t.completed_date).length;
    const total = tasksForShipment.length || 1;
    return { id: s.id, completed, total, percent: Math.round((completed / total) * 100) };
  });

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col gap-4 px-4 py-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Order {order.order_no}</h1>
          <p className="text-sm text-slate-600">
            顧客: {order.customers?.name} / 目的地: {order.destination} / Incoterms: {order.incoterms}
          </p>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          <Card>
            <SectionTitle>Order工程（1-4）</SectionTitle>
            <TaskDateEdit tasks={orderTasks} />
          </Card>

          <Card>
            <SectionTitle>Shipment一覧</SectionTitle>
            <div className="mt-2 space-y-3 text-xs">
              {shipments.length === 0 && <p className="text-slate-500">まだShipmentがありません。</p>}
              {shipments.map((s) => {
                const prog = shipmentProgress.find((p) => p.id === s.id);
                return (
                  <div key={s.id} className="rounded-lg border border-slate-100 p-2">
                    <div className="flex items-center justify-between gap-2">
                      <a href={`/shipments/${s.id}`} className="font-medium text-slate-900 hover:underline">
                        {s.bl_no || "BL未確定"}
                      </a>
                      <span className="text-[11px] text-slate-500">
                        ETD {s.etd ?? "-"} / ETA {s.eta ?? "-"}
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={prog?.percent ?? 0} />
                      <div className="mt-1 text-[11px] text-slate-500">
                        工程: {prog?.completed ?? 0} / {prog?.total ?? 0}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <ShipmentAddForm orderId={order.id} />
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionTitle>Payment1 / Payment2</SectionTitle>
            <p className="mt-1 text-[11px] text-slate-500">
              Orderスコープの Payment1 (DIA→ARAVA) / Payment2 (ARAVA→WPJ) の予定・入金状況。
            </p>
            <div className="mt-3">
              <PaymentWidget paymentIds={paymentIds} />
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

async function fetchOrderWithRelations(supabase: SupabaseClient, id: string) {
  return supabase
    .from("orders")
    .select(
      `
      *,
      customers (*),
      shipments (*),
      payments (*),
      tasks (*)
    `,
    )
    .eq("id", id)
    .single<OrderDetail>();
}

