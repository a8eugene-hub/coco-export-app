import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");
  if (!idsParam) {
    return NextResponse.json([]);
  }
  const ids = idsParam.split(",").filter(Boolean);

  const results = await Promise.all(
    ids.map(async (id) => {
      const [{ data: payment }, { data: revisions }, { data: txs }] = await Promise.all([
        supabase.from("payments").select("*").eq("id", id).single(),
        supabase
          .from("payment_revisions")
          .select("*")
          .eq("payment_id", id)
          .order("revised_at", { ascending: true }),
        supabase
          .from("payment_transactions")
          .select("*")
          .eq("payment_id", id)
          .order("paid_date", { ascending: true }),
      ]);

      if (!payment) return null;

      const latestRevision = revisions && revisions.length > 0 ? revisions[revisions.length - 1] : null;
      let plannedTotal = latestRevision ? Number(latestRevision.amount_planned) : 0;

      // 既存データで revision が 0 のままの場合、
      // Order に紐づく Payment1 については「ベール単価 × ベール数」から推定して表示だけ補正する
      if (
        plannedTotal === 0 &&
        payment.scope === "ORDER" &&
        payment.payment_type === "PAYMENT1" &&
        payment.order_id
      ) {
        const { data: order } = await supabase
          .from("orders")
          .select("unit_price, bales_count")
          .eq("id", payment.order_id)
          .single();
        if (order && order.unit_price != null && order.bales_count != null) {
          const estimated = Number(order.unit_price) * Number(order.bales_count);
          if (!Number.isNaN(estimated) && estimated > 0) {
            plannedTotal = estimated;
          }
        }
      }
      const paidTotal =
        txs?.reduce((sum, t) => {
          return sum + Number(t.amount_paid);
        }, 0) ?? 0;

      let status: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
      if (paidTotal === 0) status = "UNPAID";
      else if (paidTotal < plannedTotal) status = "PARTIAL";
      else status = "PAID";

      return {
        payment,
        latest_planned: plannedTotal,
        paid_total: paidTotal,
        status,
        revisions: revisions ?? [],
        transactions: txs ?? [],
      };
    }),
  );

  return NextResponse.json(results.filter(Boolean));
}

