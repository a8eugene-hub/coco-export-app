"use client";

import { useMemo, useState } from "react";
import useSWR from "swr";
import type { ConversationMessage } from "@/types/chat";
import { Card, SectionTitle, Button } from "@/components/ui";

type UploadedImageRow = {
  id: string;
  original_filename: string;
  sha256_hash: string;
  processing_status: string;
  created_at: string;
  error_text: string | null;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function ChatMessageBubble({ m, lang }: { m: ConversationMessage; lang: "orig" | "ja" }) {
  const text = lang === "ja" ? m.text_ja ?? m.text_original : m.text_original;
  const sender = m.sender ?? "unknown";
  const time = m.time_text ?? "";

  const isFile = m.type === "file";
  if (isFile) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
        <div className="text-[11px] font-medium text-slate-700">ファイル</div>
        <div className="mt-1 text-slate-900">{m.file_name ?? "unknown"}</div>
        {m.file_hint && <div className="mt-1 text-[11px] text-slate-500">{m.file_hint}</div>}
        <div className="mt-2 text-[10px] text-slate-400">
          {sender} {time && `· ${time}`}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-slate-900/5 px-3 py-2 text-xs text-slate-900">
      <div className="text-[10px] text-slate-500">
        {sender} {time && `· ${time}`}
      </div>
      <div className="mt-1 whitespace-pre-wrap leading-relaxed">{text ?? ""}</div>
    </div>
  );
}

function ChatPane({ title, messages, lang }: { title: string; messages: ConversationMessage[]; lang: "orig" | "ja" }) {
  return (
    <div className="flex min-h-0 flex-col">
      <div className="mb-2 text-xs font-semibold text-slate-700">{title}</div>
      <div className="min-h-0 flex-1 space-y-2 overflow-auto rounded-xl border border-slate-100 bg-white p-3">
        {messages.length === 0 && <div className="text-xs text-slate-500">まだメッセージがありません。</div>}
        {messages.map((m) => (
          <ChatMessageBubble key={m.id + lang} m={m} lang={lang} />
        ))}
      </div>
    </div>
  );
}

export function MessagesTool() {
  const { data: images, mutate: mutateImages } = useSWR<UploadedImageRow[]>("/api/messages/images", fetcher);
  const { data: convo, mutate: mutateConvo } = useSWR<ConversationMessage[]>("/api/messages/conversation", fetcher);
  const [files, setFiles] = useState<FileList | null>(null);
  const [uploading, setUploading] = useState(false);
  const [resultText, setResultText] = useState<string | null>(null);

  const messages = useMemo(() => (Array.isArray(convo) ? convo : []), [convo]);

  async function upload() {
    if (!files || files.length === 0) return;
    setUploading(true);
    setResultText(null);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    try {
      const res = await fetch("/api/messages/upload", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) {
        setResultText(json?.error ?? "アップロードに失敗しました");
        return;
      }
      const summary =
        Array.isArray(json?.results) ? json.results.map((r: any) => `${r.status}`).join(", ") : "OK";
      setResultText(`処理結果: ${summary}`);
      await Promise.all([mutateImages(), mutateConvo()]);
    } catch {
      setResultText("アップロードに失敗しました（通信エラー）");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
      <Card>
        <SectionTitle>メッセージ（スクリーンショット復元）</SectionTitle>
        <p className="mt-1 text-xs text-slate-600">
          チャットのスクリーンショットをアップロードすると、会話として復元し、日本語訳も表示します。
        </p>
        <div className="mt-3 flex flex-col gap-2">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setFiles(e.target.files)}
            className="text-xs"
          />
          <Button type="button" onClick={upload} disabled={uploading || !files || files.length === 0}>
            {uploading ? "処理中..." : "アップロードして処理"}
          </Button>
          {resultText && <p className="text-xs text-slate-600">{resultText}</p>}
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold text-slate-700">アップロード画像</div>
          <ul className="mt-2 space-y-1 text-xs">
            {(images ?? []).length === 0 && <li className="text-slate-500">まだありません。</li>}
            {(images ?? []).map((img) => (
              <li key={img.id} className="rounded-lg border border-slate-100 bg-white p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-slate-800">{img.original_filename}</span>
                  <span className="text-[11px] text-slate-500">{img.processing_status}</span>
                </div>
                {img.error_text && <div className="mt-1 text-[11px] text-rose-600">{img.error_text}</div>}
                <div className="mt-1 text-[10px] text-slate-400">{img.sha256_hash.slice(0, 12)}</div>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <div className="grid min-h-[70vh] gap-4 md:grid-cols-2">
        <ChatPane title="Original" messages={messages} lang="orig" />
        <ChatPane title="日本語" messages={messages} lang="ja" />
      </div>
    </div>
  );
}

