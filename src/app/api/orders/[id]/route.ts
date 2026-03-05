import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function GET(_req: NextRequest, context: any) {
  const { id } = await context.params;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers (*),
      shipments (*),
      payments (*),
      tasks (*),
      documents (*)
    `,
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("GET /api/orders/:id error", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, context: any) {
  const { id } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();

  const { data, error } = await supabase
    .from("orders")
    .update({
      ...body,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    console.error("PATCH /api/orders/:id error", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, context: any) {
  const { id } = await context.params;
  const supabase = createServiceClient();

  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/orders/:id error", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

