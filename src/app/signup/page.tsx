"use client";

import Link from "next/link";
import { createClientBrowser } from "@/lib/supabaseClient";
import { type FormEvent, useState } from "react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createClientBrowser();
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${typeof window !== "undefined" ? window.location.origin : ""}/login` },
      });
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError("登録に失敗しました。時間をおいて再度お試しください。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900">確認メールを送信しました</h1>
          <p className="mt-2 text-sm text-slate-600">
            登録したメールアドレスに確認リンクを送りました。リンクをクリックしてアカウントを有効にしてください。
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
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">新規登録</h1>
        <p className="mt-2 text-sm text-slate-600">メールアドレスとパスワードを設定してアカウントを作成します。</p>
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
          <div>
            <label className="block text-sm font-medium text-slate-700">
              パスワード（6文字以上）
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            {loading ? "登録中..." : "登録する"}
          </button>
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link href="/login" className="hover:underline">すでにアカウントをお持ちの方はログイン</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
