"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { AuthNav } from "./auth-nav";
import { useLanguage } from "./language-provider";
import type { Lang } from "@/lib/i18n";

export function AppShell({ children }: { children: ReactNode }) {
  const { lang, setLang, t } = useLanguage();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="sticky top-0 z-10 border-b border-slate-100 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-xl bg-slate-900 text-sm font-semibold text-white">
              C
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">{t("app_title")}</div>
              <div className="text-[11px] text-slate-500">{t("app_subtitle")}</div>
            </div>
          </Link>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-slate-200 p-0.5 text-[11px]">
              {(["ja", "en", "si"] as Lang[]).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLang(l)}
                  className={`rounded-md px-2 py-1 uppercase ${lang === l ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {l === "si" ? "SI" : l}
                </button>
              ))}
            </div>
            <AuthNav />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

