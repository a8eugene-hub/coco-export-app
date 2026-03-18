import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("uploaded_images")
    .select("id, original_filename, sha256_hash, processing_status, created_at, error_text")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
  return NextResponse.json(data ?? []);
}

