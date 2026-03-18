import type { ExtractedMessage } from "@/types/chat";
import { buildDedupeKey } from "@/lib/normalizeMessage";

export function computeDedupeKeyForExtracted(m: ExtractedMessage) {
  return buildDedupeKey({
    type: m.type,
    sender: m.sender,
    time_text: m.time,
    text_original: m.text_original,
    file_name: m.file_name,
  });
}

export function dedupeExtracted(messages: ExtractedMessage[]) {
  const seen = new Set<string>();
  const out: (ExtractedMessage & { dedupe_key: string })[] = [];
  for (const m of messages) {
    const key = computeDedupeKeyForExtracted(m);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...m, dedupe_key: key });
  }
  return out;
}

