import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

const SHIPMENT_TASK_DEFS = [
  { task_key: "PRODUCTION", title: "Production" },
  { task_key: "LOADING", title: "Loading" },
  { task_key: "SHIPPED", title: "Shipped" },
  { task_key: "TRACKING", title: "Tracking" },
  { task_key: "ARRIVED", title: "Arrived" },
  { task_key: "DELIVERED", title: "Delivered" },
] as const;

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("*, tasks(*), payments(*), documents(*)")
    .eq("order_id", orderId)
    .order("etd", { ascending: true });

  if (error) {
    console.error("GET /api/orders/:orderId/shipments error", error);
    return NextResponse.json({ error: "Failed to fetch shipments" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();

  const {
    bl_no,
    shipment_period,
    etd,
    eta,
    vessel_name,
    voyage_no,
    container_type,
    container_count,
    notes,
  } = body;

  const { data: shipment, error } = await supabase
    .from("shipments")
    .insert({
      order_id: orderId,
      bl_no,
      shipment_period,
      etd,
      eta,
      vessel_name,
      voyage_no,
      container_type,
      container_count,
      notes,
    })
    .select("*")
    .single();

  if (error || !shipment) {
    console.error("POST /api/orders/:orderId/shipments error", error);
    return NextResponse.json({ error: "Failed to create shipment" }, { status: 500 });
  }

  const shipmentId = shipment.id as string;

  // Shipment工程タスク(5-10) 自動生成
  const taskInserts = SHIPMENT_TASK_DEFS.map((def) => ({
    scope: "SHIPMENT",
    order_id: orderId,
    shipment_id: shipmentId,
    task_key: def.task_key,
    title: def.title,
    assignee: null,
  }));

  const { error: tasksError } = await supabase.from("tasks").insert(taskInserts);
  if (tasksError) {
    console.error("POST /api/orders/:orderId/shipments tasks auto-create error", tasksError);
  }

  return NextResponse.json(shipment, { status: 201 });
}

