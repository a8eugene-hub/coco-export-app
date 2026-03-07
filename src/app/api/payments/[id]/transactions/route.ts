import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
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

  return NextResponse.json(tx, { status: 201 });
}
