import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("conversation_messages")
    .select("id, sender, time_text, type, text_original, text_ja, file_name, file_hint, sort_order, created_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(1000);
  if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

