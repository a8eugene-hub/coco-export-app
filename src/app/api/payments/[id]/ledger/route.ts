import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest, context: any) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const supabase = createServiceClient();

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

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  const latestRevision = revisions && revisions.length > 0 ? revisions[revisions.length - 1] : null;
  const plannedTotal = latestRevision ? Number(latestRevision.amount_planned) : 0;
  const paidTotal =
    txs?.reduce((sum, t) => {
      return sum + Number(t.amount_paid);
    }, 0) ?? 0;

  let status: "UNPAID" | "PARTIAL" | "PAID" = "UNPAID";
  if (paidTotal === 0) status = "UNPAID";
  else if (paidTotal < plannedTotal) status = "PARTIAL";
  else status = "PAID";

  return NextResponse.json({
    payment,
    latest_planned: plannedTotal,
    paid_total: paidTotal,
    status,
    revisions: revisions ?? [],
    transactions: txs ?? [],
  });
}

