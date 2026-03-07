"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function DiaOrderUploadButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    inputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.includes("pdf")) {
      setError("PDFファイルを選択してください");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/orders/draft-upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "読み込みに失敗しました");
        return;
      }
      if (json.draft_id) {
        router.push(`/orders/new?draft=${json.draft_id}`);
        router.refresh();
      }
    } catch (err) {
      console.error(err);
      setError("通信に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={loading}
      />
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-70"
      >
        {loading ? "読み込み中..." : "DIA注文-読み込み"}
      </button>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
