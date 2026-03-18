import type { ExtractedMessage } from "@/types/chat";
import { openaiText } from "@/lib/openai";

export async function translateToJapanese(messages: ExtractedMessage[]) {
  const model = process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini";
  const system = "Translate to Japanese. Keep proper nouns and numbers. Return only the translated text.";

  const out: { source: ExtractedMessage; ja: string | null }[] = [];
  for (const m of messages) {
    if (!m.text_original || !m.text_original.trim()) {
      out.push({ source: m, ja: null });
      continue;
    }
    try {
      const ja = await openaiText({ model, system, userText: m.text_original });
      out.push({ source: m, ja: ja || null });
    } catch {
      out.push({ source: m, ja: null });
    }
  }
  return out;
}

