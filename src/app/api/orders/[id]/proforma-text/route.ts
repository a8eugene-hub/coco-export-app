import { NextResponse, type NextRequest } from "next/server";
import * as pdfParse from "pdf-parse";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id: orderId } = await context.params;
  const supabase = createServiceClient();

  // Order に紐づく最新の PROFORMA ドキュメントを取得
  const { data: docs, error: docError } = await supabase
    .from("documents")
    .select("id, storage_bucket, storage_path, file_name")
    .eq("scope", "ORDER")
    .eq("order_id", orderId)
    .eq("document_type", "PROFORMA")
    .order("uploaded_at", { ascending: false })
    .limit(1);

  if (docError) {
    console.error("GET /api/orders/[id]/proforma-text query error", docError);
    return NextResponse.json({ error: "PROFORMA document query failed" }, { status: 500 });
  }

  const doc = docs && docs.length > 0 ? docs[0] : null;
  if (!doc) {
    return NextResponse.json({ error: "PROFORMA document not found" }, { status: 404 });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(doc.storage_bucket)
    .download(doc.storage_path);

  if (downloadError || !file) {
    console.error("GET /api/orders/[id]/proforma-text download error", downloadError);
    return NextResponse.json({ error: "Failed to download PROFORMA file" }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    const parsed = await (pdfParse as any)(buffer);
    text = parsed.text || "";
  } catch (e) {
    console.error("GET /api/orders/[id]/proforma-text pdf-parse error", e);
    return NextResponse.json({ error: "PDFの解析に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(
    {
      order_id: orderId,
      document_id: doc.id,
      file_name: doc.file_name,
      text,
    },
    { status: 200 },
  );
}

