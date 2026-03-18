import type { ExtractedMessage } from "@/types/chat";
import { openaiJson } from "@/lib/openai";

const EXTRACTION_SCHEMA = {
  name: "chat_extraction",
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      messages: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            sender: { anyOf: [{ type: "string" }, { type: "null" }] },
            time: { anyOf: [{ type: "string" }, { type: "null" }] },
            type: { type: "string" },
            text_original: { anyOf: [{ type: "string" }, { type: "null" }] },
            file_name: { anyOf: [{ type: "string" }, { type: "null" }] },
            file_hint: { anyOf: [{ type: "string" }, { type: "null" }] },
            order_hint: { type: "number" },
            source_image_id: { type: "string" },
          },
          required: ["sender", "time", "type", "text_original", "file_name", "file_hint", "order_hint", "source_image_id"],
        },
      },
    },
    required: ["messages"],
  },
};

export async function extractChatFromImage(params: { base64DataUrl: string; sourceImageId: string }) {
  const system = [
    "You extract chat conversations from screenshots.",
    "Return JSON only. Do not translate.",
    "Preserve original text as-is as much as possible.",
    "Detect file/attachment blocks and output type='file' with file_name/file_hint if possible.",
    "If sender or time is not visible, set null.",
    "order_hint should reflect top-to-bottom order in the screenshot.",
    "source_image_id must be the provided sourceImageId for every message.",
  ].join("\n");

  const user = [
    {
      type: "input_text",
      text: `sourceImageId: ${params.sourceImageId}`,
    },
    {
      type: "input_image",
      image_url: params.base64DataUrl,
    },
  ];

  const out = await openaiJson<{ messages: ExtractedMessage[] }>({
    model: process.env.OPENAI_VISION_MODEL || "gpt-4.1-mini",
    system,
    user,
    jsonSchema: EXTRACTION_SCHEMA,
  });

  // 軽い整形
  const messages = Array.isArray(out.messages) ? out.messages : [];
  return messages.map((m, idx) => ({
    sender: m.sender ?? null,
    time: m.time ?? null,
    type: (m.type as any) ?? "unknown",
    text_original: m.text_original ?? null,
    file_name: m.file_name ?? null,
    file_hint: m.file_hint ?? null,
    order_hint: typeof m.order_hint === "number" ? m.order_hint : idx,
    source_image_id: params.sourceImageId,
  })) as ExtractedMessage[];
}

