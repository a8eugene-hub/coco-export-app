"use client";

import Link from "next/link";
import { createClientBrowser } from "@/lib/supabaseClient";
import { type FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClientBrowser();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/reset-password`,
      });
      if (resetError) {
        const msg = resetError.message.toLowerCase();
        if (msg.includes("rate limit") || msg.includes("email rate limit")) {
          setError("送信回数が上限に達しました。この制限はアプリ全体にかかります。しばらく（目安：1時間）待ってから再度お試しください。");
        } else if (msg.includes("user not found") || msg.includes("invalid") && msg.includes("email")) {
          setError("このメールアドレスは登録されていません。入力内容をご確認ください。");
        } else if (msg.includes("email not confirmed")) {
          setError("メールアドレスの確認がまだ完了していません。登録時の確認メールをご確認ください。");
        } else {
          setError("送信に失敗しました。入力内容を確認するか、しばらく経ってから再度お試しください。");
        }
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900">メールを送信しました</h1>
          <p className="mt-2 text-sm text-slate-600">
            ご登録のメールアドレスにパスワード再設定用のリンクを送りました。リンクをクリックして新しいパスワードを設定してください。
          </p>
          <Link href="/login" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            ログインへ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">パスワードをリセット</h1>
        <p className="mt-2 text-sm text-slate-600">
          登録したメールアドレスを入力すると、再設定用のリンクを送信します。
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500"
              />
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "送信中..." : "送信する"}
          </button>
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link href="/login" className="hover:underline">ログインに戻る</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
