import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function DELETE(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const supabase = createServiceClient();

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("storage_bucket, storage_path")
    .eq("id", id)
    .single();
  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const { error: storageError } = await supabase.storage
    .from(doc.storage_bucket)
    .remove([doc.storage_path]);
  if (storageError) {
    console.error("DELETE /api/documents/:id storage error", storageError);
    return NextResponse.json({ error: "Failed to delete file from storage" }, { status: 500 });
  }

  const { error: deleteError } = await supabase.from("documents").delete().eq("id", id);
  if (deleteError) {
    console.error("DELETE /api/documents/:id db error", deleteError);
    return NextResponse.json({ error: "Failed to delete document record" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

