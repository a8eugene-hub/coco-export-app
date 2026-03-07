import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabaseClient";

const BUCKET = "documents-private";
const DOC_TYPES = ["PO", "PROFORMA", "COMMERCIAL_INVOICE", "PACKING_LIST", "BL", "PHYTO", "COO", "FUMIGATION", "PAYMENT_RECEIPT", "OTHER"] as const;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const scope = searchParams.get("scope") as "ORDER" | "SHIPMENT" | "PAYMENT" | null;
  const orderId = searchParams.get("order_id");
  const shipmentId = searchParams.get("shipment_id");
  const paymentId = searchParams.get("payment_id");
  if (!scope || !orderId) {
    return NextResponse.json({ error: "scope and order_id required" }, { status: 400 });
  }
  const supabase = createServiceClient();
  let query = supabase.from("documents").select("id, document_type, file_name, uploaded_at, notes").eq("scope", scope).eq("order_id", orderId);
  if (scope === "SHIPMENT" && shipmentId) query = query.eq("shipment_id", shipmentId);
  if (scope === "PAYMENT" && paymentId) query = query.eq("payment_id", paymentId);
  const { data, error } = await query.order("uploaded_at", { ascending: false });
  if (error) {
    console.error("GET /api/documents error", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = createServiceClient();
  const formData = await req.formData();
  const scope = formData.get("scope") as string | null;
  const orderId = formData.get("order_id") as string | null;
  const shipmentId = (formData.get("shipment_id") as string) || null;
  const paymentId = (formData.get("payment_id") as string) || null;
  const documentType = formData.get("document_type") as string | null;
  const file = formData.get("file") as File | null;
  if (!scope || !orderId || !documentType || !file?.size) {
    return NextResponse.json({ error: "scope, order_id, document_type and file are required" }, { status: 400 });
  }
  if (!DOC_TYPES.includes(documentType as typeof DOC_TYPES[number])) {
    return NextResponse.json({ error: "Invalid document_type" }, { status: 400 });
  }
  const uuid = crypto.randomUUID();
  const ext = file.name.split(".").pop() || "bin";
  const storagePath = `${scope}/${orderId}/${documentType}/${uuid}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, buf, { contentType: file.type, upsert: false });
  if (uploadError) {
    console.error("document upload error", uploadError);
    return NextResponse.json({ error: "アップロードに失敗しました。Storage バケット " + BUCKET + " を作成してください。" }, { status: 500 });
  }
  const { data: doc, error: insertError } = await supabase
    .from("documents")
    .insert({
      scope,
      document_type: documentType,
      order_id: orderId,
      shipment_id: scope === "SHIPMENT" ? shipmentId : null,
      payment_id: scope === "PAYMENT" ? paymentId : null,
      file_name: file.name,
      storage_bucket: BUCKET,
      storage_path: storagePath,
    })
    .select("*")
    .single();
  if (insertError) {
    console.error("document insert error", insertError);
    return NextResponse.json({ error: "登録に失敗しました" }, { status: 500 });
  }
  return NextResponse.json(doc, { status: 201 });
}
