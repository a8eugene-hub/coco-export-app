import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const supabase = createServiceClient();

  const { data: draft, error } = await supabase
    .from("order_draft_uploads")
    .select("id, file_name, storage_bucket, storage_path, extracted_data, uploaded_at")
    .eq("id", id)
    .single();

  if (error || !draft) {
    return NextResponse.json({ error: "見つかりません" }, { status: 404 });
  }

  const { data: signed } = await supabase.storage
    .from(draft.storage_bucket)
    .createSignedUrl(draft.storage_path, 3600);

  return NextResponse.json({
    ...draft,
    view_url: signed?.signedUrl ?? null,
  });
}
