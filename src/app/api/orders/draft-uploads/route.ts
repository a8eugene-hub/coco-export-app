import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("order_draft_uploads")
    .select("id, file_name, uploaded_at, extracted_data")
    .order("uploaded_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("GET draft-uploads error", error);
    return NextResponse.json({ error: "一覧の取得に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}
