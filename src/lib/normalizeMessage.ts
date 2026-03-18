import { sha256Hex } from "@/lib/hash";

export function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[“”"']/g, "")
    .replace(/[.,!?、。]/g, "")
    .trim();
}

export function buildDedupeKey(input: {
  type: string;
  sender: string | null;
  time_text: string | null;
  text_original: string | null;
  file_name: string | null;
}) {
  const sender = normalizeText(input.sender ?? "");
  const time = (input.time_text ?? "").trim();
  const type = (input.type ?? "unknown").trim();

  const baseText = normalizeText(input.text_original ?? "");
  const file = normalizeText(input.file_name ?? "");

  // 時刻があれば sender+time+type を強めに使う
  const material = time ? `${type}|${sender}|${time}|${baseText}|${file}` : `${type}|${sender}|${baseText}|${file}`;
  const digest = sha256Hex(Buffer.from(material, "utf8")).slice(0, 24);
  return `${type}:${digest}`;
}

