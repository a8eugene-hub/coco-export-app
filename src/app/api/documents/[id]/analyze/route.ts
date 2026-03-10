import { NextResponse, type NextRequest } from "next/server";
import * as pdfParse from "pdf-parse";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const supabase = createServiceClient();

  const { data: doc, error: fetchError } = await supabase
    .from("documents")
    .select("storage_bucket, storage_path, document_type, file_name")
    .eq("id", id)
    .single();

  if (fetchError || !doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.document_type !== "PROFORMA") {
    return NextResponse.json({ error: "Only PROFORMA documents can be analyzed" }, { status: 400 });
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from(doc.storage_bucket)
    .download(doc.storage_path);

  if (downloadError || !file) {
    console.error("proforma analyze download error", downloadError);
    return NextResponse.json({ error: "Failed to download file from storage" }, { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  let text = "";
  try {
    // pdf-parse は CommonJS エクスポートのため名前空間インポート経由で呼び出す
    const parsed = await (pdfParse as any)(buffer);
    text = parsed.text || "";
  } catch (e) {
    console.error("proforma analyze pdf-parse error", e);
    return NextResponse.json({ error: "PDFの解析に失敗しました" }, { status: 500 });
  }

  const issues: string[] = [];

  const normalized = text.replace(/\s+/g, " ").toLowerCase();

  if (!normalized.includes("proforma")) {
    issues.push("書類内に \"Proforma\" の記載が見つかりませんでした。Proforma Invoice 形式か確認してください。");
  }

  if (!normalized.includes("buyer")) {
    issues.push("Buyer の情報が見つかりませんでした。Buyer 行を確認してください。");
  }

  if (!normalized.includes("consignee")) {
    issues.push("Consignee の情報が見つかりませんでした。Consignee 行を確認してください。");
  }

  if (!normalized.includes("destination")) {
    issues.push("Destination の記載が見つかりませんでした。仕向港の行を確認してください。");
  }

  if (!/total\s+[\d,]+\.\d{2}/i.test(text)) {
    issues.push("合計金額 (Total xxx.xx) の形式が確認できませんでした。金額表を確認してください。");
  }

  const ok = issues.length === 0;

  return NextResponse.json(
    {
      ok,
      issues,
      summary: ok
        ? "大きな問題は見つかりませんでした。"
        : "いくつか確認が必要な点があります。",
    },
    { status: 200 },
  );
}

