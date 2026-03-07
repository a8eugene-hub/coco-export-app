import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const supabase = createServiceClient();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") ?? "";
  let query = supabase
    .from("customers")
    .select("id, name, country, email, phone, address, created_at")
    .order("name", { ascending: true })
    .limit(200);
  if (q.trim()) {
    query = query.or(`name.ilike.%${q}%,email.ilike.%${q}%,country.ilike.%${q}%`);
  }
  const { data, error } = await query;
  if (error) {
    console.error("GET /api/customers error", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const body = await req.json();
  const { name, country, email, phone, address } = body as Record<string, string>;
  if (!name?.trim()) {
    return NextResponse.json({ error: "顧客名は必須です" }, { status: 400 });
  }
  const { data, error } = await supabase
    .from("customers")
    .insert({ name: name.trim(), country: country || null, email: email || null, phone: phone || null, address: address || null })
    .select("*")
    .single();
  if (error) {
    console.error("POST /api/customers error", error);
    return NextResponse.json({ error: "顧客の作成に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(data, { status: 201 });
}
