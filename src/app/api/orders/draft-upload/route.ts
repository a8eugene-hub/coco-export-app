import { NextResponse, type NextRequest } from "next/server";
import { PDFParse } from "pdf-parse";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

const BUCKET = "documents-private";
const DRAFT_PREFIX = "order-drafts";

/** DIA注文書PDFから発注に必要な項目を細かく抽出 */
function extractOrderFromDiaPdf(text: string): Record<string, unknown> {
  const lines = text.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  const full = lines.join(" ");

  const result: Record<string, unknown> = {};

  // 基本番号・日付
  const proformaMatch = full.match(/Proforma\s+No\.?\s*:?\s*([A-Z0-9\-]+)/i);
  if (proformaMatch) result.proforma_no = proformaMatch[1].trim();

  const refMatch = full.match(/Customer\s+Ref\s+No\.?\s*:?\s*([A-Z0-9\/\-\s]+?)(?=\s+Date|$|Buyer)/i)
    ?? full.match(/Ref\s+No\.?\s*:?\s*([A-Z0-9\/\-\s]+)/i);
  if (refMatch) result.order_no = refMatch[1].replace(/\s+/g, "").trim();

  const dateMatch = full.match(/Date\s*:?\s*(\d{1,2})\/(\d{1,2})\/(\d{2})/);
  if (dateMatch) {
    const [, d, m, y] = dateMatch;
    const year = parseInt(y, 10) < 50 ? `20${y}` : `19${y}`;
    result.order_date = `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  // 顧客・宛先
  const buyerMatch = full.match(/Buyer\s*:?\s*([^\n]+?)(?=\s+Consignee|$)/i);
  if (buyerMatch) result.customer_name = buyerMatch[1].trim().split(/\s{2,}|\n/)[0].trim();

  const destMatch = full.match(/Destination\s*:?\s*([^\n]+?)(?=\s*Mode|$)/i);
  if (destMatch) result.destination = destMatch[1].trim();

  const currencyMatch = full.match(/Currency\s*:?\s*([A-Z]{3})/i);
  result.currency = currencyMatch ? currencyMatch[1].toUpperCase() : "USD";

  const cifMatch = full.match(/(CIF|FOB|CFR|EXW)\s+([^\n,]+)/i);
  if (cifMatch) result.incoterms = `${cifMatch[1].trim()} ${(cifMatch[2] || "").trim()}`.trim();

  // サイズ・数量・価格（書類から読める範囲）
  const sizeMatch = full.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*cm/i) ?? text.match(/(\d+)\s*x\s*(\d+)\s*x\s*(\d+)\s*cm/i);
  if (sizeMatch) result.size_cm = `${sizeMatch[1]}x${sizeMatch[2]}x${sizeMatch[3]}cm`;

  const weightMatch = full.match(/(\d+)\s*[-~]\s*(\d+)\s*kg/i) ?? full.match(/(\d+)\s*kg/i);
  if (weightMatch) result.weight_kg = weightMatch[2] ? `${weightMatch[1]}-${weightMatch[2]}kg` : `${weightMatch[1]}kg`;

  const priceMatch = full.match(/Price\s+Per\s+MT[^\d]*(\d+[\d.]*)/i) ?? full.match(/(\d+[\d.]*)\s*\(\s*USD\s*\)/);
  if (priceMatch) result.price_per_mt_usd = priceMatch[1].trim();

  const totalMatch = full.match(/Total[^\d]*(\d+[\d.,]+)/i) ?? full.match(/\$\s*(\d+[\d.,]+)/);
  if (totalMatch) result.total_value = totalMatch[1].replace(/,/g, "").trim();

  const qtyMatch = full.match(/Total\s+(\d+[\d.]*)\s+(\d+[\d.]*)/) ?? full.match(/(\d+[\d.]*)\s+(\d+[\d.,]+)\s*$/);
  if (qtyMatch) result.quantity = qtyMatch[1] || qtyMatch[2];

  // コンテナ・船積
  const containerTypeMatch = full.match(/Type\s+of\s+Container\s*:?\s*[-]?\s*([A-Z0-9\-]+)/i)
    ?? full.match(/Container\s*:?\s*([A-Z0-9\-]+)/i);
  if (containerTypeMatch) result.container_type = containerTypeMatch[1].trim();

  const containerCountMatch = full.match(/No\s+of\s+Containers\s*:?\s*[-]?\s*(\d+)/i)
    ?? full.match(/No\s+of\s+Containers\s*:?\s*(\d+)/i)
    ?? full.match(/Containers\s*:?\s*(\d+)/i);
  if (containerCountMatch) result.container_count = parseInt(containerCountMatch[1], 10);

  const periodMatch = full.match(/Shipment\s+Period\s*:?\s*[-]?\s*([^\n]+?)(?=\s*Shipping|$)/i);
  if (periodMatch) result.shipment_period = periodMatch[1].trim();

  const modeMatch = full.match(/Mode\s+of\s+Shipment[^:]*:\s*(\w+)/i);
  if (modeMatch) result.mode_shipment = modeMatch[1].trim();

  const fclMatch = full.match(/Type\s*\(LCL\s*\/\s*FCL\)\s*:?\s*[-]?\s*(\w+)/i);
  if (fclMatch) result.fcl_lcl = fclMatch[1].trim();

  // 支払条件
  const paymentMatch = full.match(/Payment\s+Terms\s*:?\s*([^\n]+?)(?=\s*Total|$)/i)
    ?? full.match(/Sale\s+terms[^\n]*Payment\s+Terms\s*([^\n]+)/i);
  if (paymentMatch) result.payment_terms = paymentMatch[1].trim();

  // 備考用に読み取り結果の要約を結合
  const noteParts: string[] = [];
  if (result.size_cm) noteParts.push(`サイズ: ${result.size_cm}`);
  if (result.weight_kg) noteParts.push(`重量: ${result.weight_kg}`);
  if (result.price_per_mt_usd) noteParts.push(`Price/MT(USD): ${result.price_per_mt_usd}`);
  if (result.total_value) noteParts.push(`合計: ${result.total_value}`);
  if (result.container_type) noteParts.push(`コンテナ: ${result.container_type}`);
  if (result.container_count) noteParts.push(`本数: ${result.container_count}`);
  if (result.shipment_period) noteParts.push(`出荷時期: ${result.shipment_period}`);
  if (result.payment_terms) noteParts.push(`支払条件: ${result.payment_terms}`);
  if (noteParts.length) result.notes = noteParts.join(" / ");

  return result;
}

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || !file.size || !file.type?.includes("pdf")) {
    return NextResponse.json({ error: "PDFファイルを選択してください" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const draftId = crypto.randomUUID();
  const storagePath = `${DRAFT_PREFIX}/${draftId}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });
    if (uploadError) {
      console.error("draft-upload storage error", uploadError);
      return NextResponse.json({ error: "ファイルの保存に失敗しました。Storage バケットを確認してください。" }, { status: 500 });
    }
  } catch (err) {
    console.error("draft-upload storage", err);
    return NextResponse.json({ error: "ファイルの保存に失敗しました" }, { status: 500 });
  }

  let extracted_data: Record<string, unknown> = {};
  let text = "";
  try {
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await parser.getText();
    text = result.text ?? "";
    await parser.destroy();
    if (text && text.trim().length >= 30) {
      extracted_data = extractOrderFromDiaPdf(text);
    }
  } catch (err) {
    console.error("draft-upload parse error", err);
  }

  const { error: insertError } = await supabase.from("order_draft_uploads").insert({
    id: draftId,
    file_name: file.name,
    storage_bucket: BUCKET,
    storage_path: storagePath,
    extracted_data: Object.keys(extracted_data).length ? extracted_data : null,
    uploaded_by: user.id,
  });

  if (insertError) {
    console.error("draft-upload insert error", insertError);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({
    draft_id: draftId,
    file_name: file.name,
    extracted: extracted_data,
  }, { status: 201 });
}
