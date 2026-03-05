export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Coco Export Management System
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          スリランカ → 日本向けのココピート輸出案件（Order / Shipment / Task / Payment / Documents）
          を一元管理するための社内向けツールです。
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="/login"
            className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
          >
            ログインへ
          </a>
          <a
            href="https://app.supabase.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Supabase 設定を開く
          </a>
        </div>
      </div>
    </div>
  );
}
