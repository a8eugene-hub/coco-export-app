import { NextResponse, type NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";

const BUCKET = "documents-private";

type ProformaBody = {
  proforma_no: string;
  date: string;
  customer_ref_no: string;
  buyer_name: string;
  consignee: string;
  destination: string;
  mode_of_shipment: string;
  type_fcl_lcl: string;
  container_count: string;
  container_type: string;
  shipment_period: string;
  payment_terms: string;
  sale_terms: string;
  product_description: string;
  quantity_bales: string;
  price_per_bale: string;
  total_amount: string;
  bank_details: string;
};

export async function POST(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;

  const body = (await req.json()) as ProformaBody;
  const supabase = createServiceClient();

  // 注文・顧客情報を取得
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select(
      `
      *,
      customers (*)
    `,
    )
    .eq("id", id)
    .single();

  if (orderError || !order) {
    console.error("POST /api/orders/[id]/proforma fetch order error", orderError);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }

  // テンプレートPDFを読み込み
  const templatePath = path.join(process.cwd(), "docs", "templates", "dia11.pdf");
  let templateBytes: Uint8Array;
  try {
    templateBytes = fs.readFileSync(templatePath);
  } catch (e) {
    console.error("proforma template read error", e);
    return NextResponse.json({ error: "テンプレートPDF(dia11.pdf)が見つかりませんでした" }, { status: 500 });
  }

  const pdfDoc = await PDFDocument.load(templateBytes);
  const pages = pdfDoc.getPages();
  const page = pages[0];
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const fontSize = 9;

  // 位置はおおよそのもの。ユーザーが後で微調整可能。
  function draw(text: string, x: number, y: number) {
    page.drawText(text, { x, y, size: fontSize, font });
  }

  // ヘッダー周辺
  draw(`Proforma No. ${body.proforma_no}`, 320, 800);
  draw(`Date : ${body.date}`, 320, 788);
  draw(`Customer Ref No. : ${body.customer_ref_no}`, 320, 776);

  // Buyer / Consignee
  draw(`Buyer : ${body.buyer_name}`, 40, 752);
  draw(`Consignee : ${body.consignee}`, 40, 740);

  // Destination / Shipment info
  draw(`Destination : ${body.destination}`, 40, 716);
  draw(`Mode of Shipment : ${body.mode_of_shipment}`, 40, 704);
  draw(`Type (LCL / FCL) : ${body.type_fcl_lcl}`, 40, 692);
  draw(`No of Containers : ${body.container_count}`, 40, 680);
  draw(`Type of Container : ${body.container_type}`, 40, 668);
  draw(`Shipment Period : ${body.shipment_period}`, 40, 656);

  // テーブル部分（1ラインのみ想定）
  const qty = body.quantity_bales || "";
  const price = body.price_per_bale || "";
  const total = body.total_amount || "";

  draw(body.product_description, 40, 620);
  draw(qty, 260, 620);
  draw(price, 320, 620);
  draw(total, 390, 620);

  // Sale / Payment terms
  draw(`Sale terms: ${body.sale_terms}`, 40, 590);
  draw(`Payment Terms: ${body.payment_terms}`, 40, 578);

  // Bank details（複数行）
  const bankLines = body.bank_details.split("\n");
  let bankY = 540;
  for (const line of bankLines) {
    draw(line, 40, bankY);
    bankY -= 12;
  }

  const pdfBytes = await pdfDoc.save();

  // Storage にアップロード
  const uuid = crypto.randomUUID();
  const fileName = `${body.proforma_no || order.order_no || "proforma"}.pdf`;
  const storagePath = `ORDER/${order.id}/PROFORMA/${uuid}.pdf`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, Buffer.from(pdfBytes), {
      contentType: "application/pdf",
      upsert: false,
    });

  if (uploadError) {
    console.error("proforma upload error", uploadError);
    return NextResponse.json({ error: "PDFのアップロードに失敗しました" }, { status: 500 });
  }

  // documents テーブルに登録
  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      scope: "ORDER",
      document_type: "PROFORMA",
      order_id: order.id,
      shipment_id: null,
      payment_id: null,
      file_name: fileName,
      storage_bucket: BUCKET,
      storage_path: storagePath,
      uploaded_by: user.id,
    })
    .select("*")
    .single();

  if (insertError) {
    console.error("proforma document insert error", insertError);
    return NextResponse.json({ error: "documents テーブルへの登録に失敗しました" }, { status: 500 });
  }

  return NextResponse.json(doc, { status: 201 });
}

