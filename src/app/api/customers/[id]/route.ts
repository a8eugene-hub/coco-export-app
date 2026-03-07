import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("customers").select("*").eq("id", id).single();
  if (error || !data) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = createServiceClient();
  const body = await req.json();
  const { name, country, email, phone, address } = body as Record<string, string>;
  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name?.trim() || null;
  if (country !== undefined) updates.country = country || null;
  if (email !== undefined) updates.email = email || null;
  if (phone !== undefined) updates.phone = phone || null;
  if (address !== undefined) updates.address = address || null;
  const { data, error } = await supabase.from("customers").update(updates).eq("id", id).select("*").single();
  if (error) {
    console.error("PATCH /api/customers/:id error", error);
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = createServiceClient();
  const { error } = await supabase.from("customers").delete().eq("id", id);
  if (error) {
    console.error("DELETE /api/customers/:id error", error);
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
