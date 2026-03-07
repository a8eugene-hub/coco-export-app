import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest, context: any) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shipments")
    .select(
      `
      *,
      orders(*),
      tasks(*),
      payments(*),
      documents(*),
      containers(*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("GET /api/shipments/:id error", error);
    return NextResponse.json({ error: "Failed to fetch shipment" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, context: any) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("shipments")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PATCH /api/shipments/:id error", error);
    return NextResponse.json({ error: "Failed to update shipment" }, { status: 500 });
  }

  return NextResponse.json(data);
}

