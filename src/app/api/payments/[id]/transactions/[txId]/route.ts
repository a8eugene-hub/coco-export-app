import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string; txId: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { txId } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();
  const { paid_date, amount_paid, memo } = body as { paid_date?: string; amount_paid?: number; memo?: string };
  const updates: Record<string, unknown> = {};
  if (paid_date !== undefined) updates.paid_date = paid_date;
  if (amount_paid !== undefined) updates.amount_paid = amount_paid;
  if (memo !== undefined) updates.memo = memo;
  const { data, error } = await supabase.from("payment_transactions").update(updates).eq("id", txId).select("*").single();
  if (error) {
    console.error("PATCH /api/payments/:id/transactions/:txId error", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string; txId: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { txId } = await context.params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("payment_transactions").delete().eq("id", txId);
  if (error) {
    console.error("DELETE /api/payments/:id/transactions/:txId error", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
