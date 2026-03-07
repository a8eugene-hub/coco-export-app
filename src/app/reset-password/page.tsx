"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClientBrowser } from "@/lib/supabaseClient";
import { type FormEvent, useEffect, useState } from "react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [invalidLink, setInvalidLink] = useState(false);

  useEffect(() => {
    const supabase = createClientBrowser();
    async function init() {
      // メール内リンクでリダイレクトされた場合のみ URL の hash に access_token 等が入る
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const access_token = params.get("access_token");
        const refresh_token = params.get("refresh_token");
        const type = params.get("type");
        if (type === "recovery" && access_token && refresh_token) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (!sessionError) {
            window.history.replaceState(null, "", window.location.pathname);
            setReady(true);
            return;
          }
        }
      }
      // リセット用リンク以外でのアクセスは案内へ
      setInvalidLink(true);
    }
    init();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 6) {
      setError("パスワードは6文字以上にしてください");
      return;
    }
    if (password !== confirm) {
      setError("パスワードが一致しません");
      return;
    }
    setLoading(true);
    try {
      const supabase = createClientBrowser();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push("/login?message=password_reset");
      router.refresh();
    } catch (err) {
      setError("パスワードの更新に失敗しました。リンクの有効期限が切れている可能性があります。");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (invalidLink) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
          <h1 className="text-xl font-semibold text-slate-900">リンクが無効または期限切れです</h1>
          <p className="mt-2 text-sm text-slate-600">
            このページは、メールで届いた「パスワードをリセット」リンクをクリックして開いてください。リンクの有効期限が切れている場合や、すでに使用した場合は、もう一度「パスワードをリセット」からメールを送信してください。
          </p>
          <Link href="/forgot-password" className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">
            もう一度リセット用メールを送る
          </Link>
          <p className="mt-4">
            <Link href="/login" className="text-sm text-slate-600 hover:underline">ログインへ</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="text-sm text-slate-500">読み込み中...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">新しいパスワードを設定</h1>
        <p className="mt-2 text-sm text-slate-600">
          新しいパスワードを入力して「設定する」を押してください。
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              新しいパスワード（6文字以上）
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
          <div>
            <label className="block text-sm font-medium text-slate-700">
              パスワード（確認）
              <input
                type="password"
                required
                minLength={6}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
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
            {loading ? "設定中..." : "設定する"}
          </button>
          <p className="mt-4 text-center text-sm text-slate-600">
            <Link href="/login" className="hover:underline">ログインに戻る</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
