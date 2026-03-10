import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: paymentId } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();
  const { paid_date, amount_paid, currency = "USD", memo } = body as {
    paid_date: string;
    amount_paid: number;
    currency?: string;
    memo?: string;
  };

  if (!paid_date || amount_paid == null) {
    return NextResponse.json(
      { error: "paid_date と amount_paid は必須です" },
      { status: 400 },
    );
  }

  const { data: tx, error } = await supabase
    .from("payment_transactions")
    .insert({
      payment_id: paymentId,
      paid_date,
      amount_paid: Number(amount_paid),
      currency: currency ?? "USD",
      memo: memo ?? null,
    })
    .select("*")
    .single();

  if (error) {
    console.error("POST /api/payments/:id/transactions error", error);
    return NextResponse.json({ error: "入金の記録に失敗しました" }, { status: 500 });
  }

  // 入金登録後に Payment のステータスを更新（UNPAID / PARTIAL / PAID）
  try {
    await recomputePaymentStatus(supabase, paymentId);
  } catch (e) {
    console.error("POST /api/payments/:id/transactions recompute status error", e);
  }

  return NextResponse.json(tx, { status: 201 });
}

async function recomputePaymentStatus(supabase: ReturnType<typeof createServiceClient>, paymentId: string) {
  const [{ data: payment }, { data: revisions }, { data: txs }] = await Promise.all([
    supabase.from("payments").select("*").eq("id", paymentId).single(),
    supabase
      .from("payment_revisions")
      .select("*")
      .eq("payment_id", paymentId)
      .order("revised_at", { ascending: true }),
    supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_id", paymentId)
      .order("paid_date", { ascending: true }),
  ]);

  if (!payment) return;

  const latestRevision = revisions && revisions.length > 0 ? revisions[revisions.length - 1] : null;
  let plannedTotal = latestRevision ? Number(latestRevision.amount_planned) : 0;

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

  await supabase.from("payments").update({ status }).eq("id", paymentId);
}

