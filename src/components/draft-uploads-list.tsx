"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card, SectionTitle } from "@/components/ui";

type Draft = { id: string; file_name: string; uploaded_at: string };

export function DraftUploadsList() {
  const [list, setList] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders/draft-uploads")
      .then((r) => r.json())
      .then((data) => setList(Array.isArray(data) ? data : []))
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || list.length === 0) return null;

  return (
    <Card>
      <SectionTitle>アップロード済みDIA注文PDF</SectionTitle>
      <p className="mt-1 text-xs text-slate-500">保管されたファイルはいつでも確認できます。</p>
      <ul className="mt-3 space-y-2">
        {list.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 py-2 px-3 text-sm">
            <span className="truncate text-slate-700">{d.file_name}</span>
            <span className="text-xs text-slate-400">{new Date(d.uploaded_at).toLocaleString("ja-JP")}</span>
            <div className="flex gap-2">
              <a
                href={`/api/orders/draft-uploads/${d.id}/download`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 underline hover:no-underline"
              >
                PDFを見る
              </a>
              <Link href={`/orders/new?draft=${d.id}`} className="text-slate-900 font-medium underline hover:no-underline">
                この内容で注文作成
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}
