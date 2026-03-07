import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
type ShipmentTask = {
  id: string;
  title: string;
  status: string;
  planned_date: string | null;
  completed_date: string | null;
};

type ShipmentPayments = {
  id: string;
};

type ShipmentDetail = {
  id: string;
  bl_no: string | null;
  etd: string | null;
  eta: string | null;
  container_type: string | null;
  container_count: number | null;
  orders: { order_no: string | null } | null;
  tasks: ShipmentTask[];
  payments: ShipmentPayments[];
};
import { redirect } from "next/navigation";
import { createClientServer } from "@/lib/supabaseClient";
import { Card, ProgressBar, SectionTitle, StatusBadge } from "@/components/ui";
import { PaymentWidget } from "@/components/payment-widget";
import { TaskDateEdit } from "@/components/task-date-edit";
import { ShipmentEditForm } from "@/components/shipment-edit-form";

type Params = { params: Promise<{ id: string }> };

export default async function ShipmentDetailPage({ params }: Params) {
  const { id } = await params;
  const cookieStore = await cookies();
  const supabase = createClientServer(cookieStore as any);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: shipment } = await fetchShipmentWithRelations(supabase, id);

  if (!shipment) redirect("/orders");

  const tasks = shipment.tasks ?? [];
  const payments = shipment.payments ?? [];
  const paymentIds = payments.map((p) => p.id);

  const completed = tasks.filter((t) => t.completed_date).length;
  const total = tasks.length || 1;
  const percent = Math.round((completed / total) * 100);

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-4 px-4 py-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Shipment {shipment.bl_no || "BL未確定"} ({shipment.orders?.order_no})
          </h1>
          <p className="text-sm text-slate-600">
            ETD {shipment.etd ?? "-"} / ETA {shipment.eta ?? "-"} / {shipment.container_count} x {shipment.container_type}
          </p>
        </div>
        <ShipmentEditForm
          shipmentId={shipment.id}
          initial={{
            bl_no: shipment.bl_no ?? "",
            etd: shipment.etd ?? "",
            eta: shipment.eta ?? "",
          }}
        />
      </header>

      <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <SectionTitle>Shipment工程（5-10）</SectionTitle>
          <div className="mt-2">
            <ProgressBar value={percent} />
            <p className="mt-1 text-[11px] text-slate-500">
              完了 {completed} / {total}
            </p>
          </div>
          <TaskDateEdit
            tasks={tasks.map((t) => ({ ...t, scope: "SHIPMENT" }))}
          />
        </Card>

        <Card>
          <SectionTitle>Shipment回収分 Payment</SectionTitle>
          <p className="mt-1 text-[11px] text-slate-500">
            Shipmentスコープの Payment1/2（分納回収）の予定・入金状況。
          </p>
          <div className="mt-3">
            <PaymentWidget paymentIds={paymentIds} />
          </div>
        </Card>
      </div>
    </div>
  );
}

async function fetchShipmentWithRelations(supabase: SupabaseClient, id: string) {
  return supabase
    .from("shipments")
    .select(
      `
      *,
      orders(*),
      tasks(*),
      payments(*)
    `,
    )
    .eq("id", id)
    .single<ShipmentDetail>();
}


