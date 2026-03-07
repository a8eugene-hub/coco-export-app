"use client";

import { useRouter } from "next/navigation";
import { createClientBrowser } from "@/lib/supabaseClient";
import { useLanguage } from "./language-provider";

export function LogoutButton() {
  const router = useRouter();
  const { t } = useLanguage();

  async function handleLogout() {
    const supabase = createClientBrowser();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
    >
      {t("nav_logout")}
    </button>
  );
}
