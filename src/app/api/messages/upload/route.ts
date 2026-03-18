import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient, getAuthUserFromRequest } from "@/lib/supabaseClient";
import { sha256Hex } from "@/lib/hash";
import { extractChatFromImage } from "@/lib/extractChatFromImage";
import { translateToJapanese } from "@/lib/translateMessages";
import { dedupeExtracted } from "@/lib/deduplicateMessages";

const BUCKET = "documents-private";

export async function POST(req: NextRequest) {
  const user = await getAuthUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const form = await req.formData();
  const files = form.getAll("files").filter((v) => v instanceof File) as File[];
  if (!files.length) return NextResponse.json({ error: "files is required" }, { status: 400 });

  const results: any[] = [];

  for (const file of files) {
    const buf = Buffer.from(await file.arrayBuffer());
    const hash = sha256Hex(buf);

    // Level1: duplicate image
    const { data: existing } = await supabase
      .from("uploaded_images")
      .select("id, sha256_hash, processing_status")
      .eq("sha256_hash", hash)
      .maybeSingle();
    if (existing) {
      results.push({ sha256_hash: hash, status: "SKIPPED_DUPLICATE", uploaded_image_id: existing.id });
      continue;
    }

    const uuid = crypto.randomUUID();
    const ext = file.name.split(".").pop() || "png";
    const storagePath = `messages/${hash}/${uuid}.${ext}`;

    const { data: uploadedImage, error: insertErr } = await supabase
      .from("uploaded_images")
      .insert({
        original_filename: file.name,
        sha256_hash: hash,
        mime_type: file.type,
        file_size: file.size,
        storage_bucket: BUCKET,
        storage_path: storagePath,
        processing_status: "PROCESSING",
      })
      .select("*")
      .single();

    if (insertErr || !uploadedImage) {
      results.push({ sha256_hash: hash, status: "FAILED", error: "failed to insert uploaded_images" });
      continue;
    }

    const uploadRes = await supabase.storage.from(BUCKET).upload(storagePath, buf, {
      contentType: file.type || "application/octet-stream",
      upsert: false,
    });
    if (uploadRes.error) {
      await supabase
        .from("uploaded_images")
        .update({ processing_status: "FAILED", error_text: uploadRes.error.message })
        .eq("id", uploadedImage.id);
      results.push({ sha256_hash: hash, status: "FAILED", error: uploadRes.error.message });
      continue;
    }

    try {
      const base64 = buf.toString("base64");
      const dataUrl = `data:${file.type || "image/png"};base64,${base64}`;

      const extracted = await extractChatFromImage({
        base64DataUrl: dataUrl,
        sourceImageId: String(uploadedImage.id),
      });
      const deduped = dedupeExtracted(extracted);

      const translated = await translateToJapanese(deduped);

      // save extracted_messages
      const extractedRows = translated.map((t) => ({
        uploaded_image_id: uploadedImage.id,
        sender: t.source.sender,
        time_text: t.source.time,
        type: t.source.type,
        text_original: t.source.text_original,
        text_ja: t.ja,
        file_name: t.source.file_name,
        file_hint: t.source.file_hint,
        order_hint: t.source.order_hint,
        source_image_id: uploadedImage.id,
        dedupe_key: (t.source as any).dedupe_key,
      }));

      await supabase.from("extracted_messages").insert(extractedRows);

      // merge into conversation_messages (upsert by dedupe_key)
      const convoRows = extractedRows.map((r) => ({
        sender: r.sender,
        time_text: r.time_text,
        type: r.type,
        text_original: r.text_original,
        text_ja: r.text_ja,
        file_name: r.file_name,
        file_hint: r.file_hint,
        first_uploaded_image_id: uploadedImage.id,
        dedupe_key: r.dedupe_key,
        sort_order: Number(r.order_hint ?? 0) + Date.now() / 1e13,
      }));

      await supabase.from("conversation_messages").upsert(convoRows, { onConflict: "dedupe_key" });

      await supabase.from("uploaded_images").update({ processing_status: "DONE" }).eq("id", uploadedImage.id);
      results.push({ sha256_hash: hash, status: "DONE", uploaded_image_id: uploadedImage.id, inserted: convoRows.length });
    } catch (e: any) {
      await supabase
        .from("uploaded_images")
        .update({ processing_status: "FAILED", error_text: String(e?.message ?? e) })
        .eq("id", uploadedImage.id);
      results.push({ sha256_hash: hash, status: "FAILED", error: String(e?.message ?? e), uploaded_image_id: uploadedImage.id });
    }
  }

  return NextResponse.json({ results }, { status: 200 });
}

