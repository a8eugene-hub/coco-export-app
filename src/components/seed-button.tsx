"use client";

import { useState } from "react";
import { Button } from "@/components/ui";

export function SeedButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/seed", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setMessage(json?.error ?? "デモデータ作成に失敗しました");
        return;
      }
      setMessage("デモデータを作成しました。注文一覧を開いて確認してください。");
    } catch (e) {
      setMessage("通信に失敗しました。時間をおいて再度お試しください。");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <Button onClick={run} disabled={loading}>
        {loading ? "作成中..." : "デモデータを作成"}
      </Button>
      {message && (
        <p className={`text-xs ${message.startsWith("デモデータを作成しました") ? "text-emerald-600" : "text-rose-600"}`}>
          {message}
        </p>
      )}
    </div>
  );
}

