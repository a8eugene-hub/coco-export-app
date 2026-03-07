import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

const ORDER_TASK_DEFS = [
  { task_key: "ORDER_RECEIVED", title: "Order received" },
  { task_key: "PO_UPLOADED", title: "PO uploaded" },
  { task_key: "AI_EXTRACTED", title: "AI extracted" },
  { task_key: "ORDER_APPROVED", title: "Order approved" },
] as const;

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createServiceClient();

  const {
    order_no,
    proforma_no,
    order_date,
    customer_id,
    customer_name,
    destination,
    incoterms,
    currency = "USD",
    notes,
    payment1_due_date,
    payment2_due_date,
    addressees,
    supplier,
    product_name,
    product_description,
    product_grade,
    particle_size,
    ec_level,
    recovery_volume,
    moisture_level,
    sieve_method,
    container_info,
    bales_count,
    weight_per_bale,
    weight_tolerance,
    bag_type,
    bales_per_container,
    container_type,
    number_of_containers,
    product_specs,
    unit_price,
    price_term,
    demurrage_free_days,
    requested_eta,
    shipment_condition,
    phyto_instructions,
    origin_requirement,
    consignee_name,
    consignee_contact,
    shipper_name,
  } = body;

  let resolvedCustomerId = customer_id as string | null;
  if (!resolvedCustomerId && customer_name) {
    const { data: newCustomer, error: custErr } = await supabase
      .from("customers")
      .insert({ name: customer_name })
      .select("*")
      .single();
    if (custErr || !newCustomer) {
      console.error("POST /api/orders customer create error", custErr);
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
    resolvedCustomerId = newCustomer.id;
  }

  const { data: order, error: insertError } = await supabase
    .from("orders")
    .insert({
      order_no,
      proforma_no,
      order_date,
      customer_id: resolvedCustomerId,
      destination,
      incoterms,
      currency,
      notes,
      addressees: addressees ?? null,
      supplier: supplier ?? null,
      product_name: product_name ?? null,
      product_description: product_description ?? null,
      product_grade: product_grade ?? null,
      particle_size: particle_size ?? null,
      ec_level: ec_level ?? null,
      recovery_volume: recovery_volume ?? null,
      moisture_level: moisture_level ?? null,
      sieve_method: sieve_method ?? null,
      container_info: container_info ?? null,
      bales_count: bales_count != null ? Number(bales_count) : null,
      weight_per_bale: weight_per_bale ?? null,
      weight_tolerance: weight_tolerance ?? null,
      bag_type: bag_type ?? null,
      bales_per_container: bales_per_container ?? null,
      container_type: container_type ?? null,
      number_of_containers: number_of_containers != null ? Number(number_of_containers) : null,
      product_specs: product_specs ?? null,
      unit_price: unit_price != null ? Number(unit_price) : null,
      price_term: price_term ?? null,
      demurrage_free_days: demurrage_free_days != null ? Number(demurrage_free_days) : null,
      requested_eta: requested_eta ?? null,
      shipment_condition: shipment_condition ?? null,
      phyto_instructions: phyto_instructions ?? null,
      origin_requirement: origin_requirement ?? null,
      consignee_name: consignee_name ?? null,
      consignee_contact: consignee_contact ?? null,
      shipper_name: shipper_name ?? null,
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

