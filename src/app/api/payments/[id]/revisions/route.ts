import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: paymentId } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();
  const { amount_planned, reason } = body as { amount_planned: number; reason?: string };
  if (amount_planned == null || Number.isNaN(Number(amount_planned))) {
    return NextResponse.json({ error: "予定額を入力してください" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("payment_revisions")
    .insert({ payment_id: paymentId, amount_planned: Number(amount_planned), reason: reason || null })
    .select("*")
    .single();
  if (error) {
    console.error("POST /api/payments/:id/revisions error", error);
    return NextResponse.json({ error: "予定額の改定に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
