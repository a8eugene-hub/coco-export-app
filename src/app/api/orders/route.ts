import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

const ORDER_TASK_DEFS = [
  { task_key: "ORDER_RECEIVED", title: "Order received" },
  { task_key: "PO_UPLOADED", title: "PO uploaded" },
  { task_key: "AI_EXTRACTED", title: "AI extracted" },
  { task_key: "ORDER_APPROVED", title: "Order approved" },
] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("query") ?? "";

  const supabase = createServiceClient();

  let base = supabase
    .from("orders")
    .select("*, customers(name), payments(payment_type, status)")
    .order("updated_at", { ascending: false });

  if (query) {
    base = base.or(
      `order_no.ilike.%${query}%,destination.ilike.%${query}%`,
    ) as typeof base;
  }

  const { data, error } = await base;
  if (error) {
    console.error("GET /api/orders error", error);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const supabase = createServiceClient();

  const {
    order_no,
    proforma_no,
    order_date,
    customer_id,
    destination,
    incoterms,
    currency = "USD",
    notes,
    payment1_due_date,
    payment2_due_date,
  } = body;

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      order_no,
      proforma_no,
      order_date,
      customer_id,
      destination,
      incoterms,
      currency,
      notes,
      created_by: null,
    })
    .select("*")
    .single();

  if (insertError || !order) {
    console.error("POST /api/orders insert error", insertError);
    return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
  }

  const orderId = order.id as string;

  // 1. Order工程タスク(1-4)自動生成
  const taskInserts = ORDER_TASK_DEFS.map((def) => ({
    scope: "ORDER",
    order_id: orderId,
    shipment_id: null,
    task_key: def.task_key,
    title: def.title,
    assignee: null,
  }));

  const { error: tasksError } = await supabase.from("tasks").insert(taskInserts);
  if (tasksError) {
    // ログだけ出しておき、クライアントには order 自体は返す
    console.error("POST /api/orders tasks auto-create error", tasksError);
  }

  // 2. Payment1/2（Order scope）自動作成 + 初期Revision(0)
  const paymentsInsert = [
    { payment_type: "PAYMENT1", due_date: payment1_due_date },
    { payment_type: "PAYMENT2", due_date: payment2_due_date },
  ].map((p) => ({
    payment_type: p.payment_type,
    scope: "ORDER",
    order_id: orderId,
    shipment_id: null,
    currency,
    due_date: p.due_date,
  }));

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .insert(paymentsInsert)
    .select("*");

  if (paymentsError) {
    console.error("POST /api/orders payments auto-create error", paymentsError);
  } else if (payments && payments.length > 0) {
    const revisions = payments.map((p) => ({
      payment_id: p.id,
      amount_planned: 0,
      revised_by: null,
    }));
    const { error: revError } = await supabase.from("payment_revisions").insert(revisions);
    if (revError) {
      console.error("POST /api/orders payment_revisions auto-create error", revError);
    }
  }

  return NextResponse.json(order, { status: 201 });
}

