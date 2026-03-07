import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: shipmentId } = await context.params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("containers")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("created_at", { ascending: true });
  if (error) {
    console.error("GET /api/shipments/:id/containers error", error);
    return NextResponse.json({ error: "Failed to fetch containers" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id: shipmentId } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();
  const { container_no, seal_no } = body as { container_no?: string; seal_no?: string };
  const { data, error } = await supabase
    .from("containers")
    .insert({ shipment_id: shipmentId, container_no: container_no || null, seal_no: seal_no || null })
    .select("*")
    .single();
  if (error) {
    console.error("POST /api/shipments/:id/containers error", error);
    return NextResponse.json({ error: "コンテナの登録に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
