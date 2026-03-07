import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const supabase = createServiceClient();
  const { data: doc, error: fetchError } = await supabase.from("documents").select("storage_bucket, storage_path, file_name").eq("id", id).single();
  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }
  const { data: signed, error: signError } = await supabase.storage
    .from(doc.storage_bucket)
    .createSignedUrl(doc.storage_path, 60);
  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Download URL could not be created" }, { status: 500 });
  }
  return NextResponse.redirect(signed.signedUrl);
}
