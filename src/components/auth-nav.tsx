"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createClientBrowser } from "@/lib/supabaseClient";
import type { User } from "@supabase/supabase-js";
import { LogoutButton } from "./logout-button";
import { useLanguage } from "./language-provider";

const navKeys = [
  { href: "/dashboard", key: "nav_dashboard" },
  { href: "/orders", key: "nav_orders" },
  { href: "/shipments", key: "nav_shipments" },
  { href: "/customers", key: "nav_customers" },
] as const;

export function AuthNav() {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const supabase = createClientBrowser();
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) =>
      setUser(session?.user ?? null)
    );
    return () => subscription.unsubscribe();
  }, []);

  if (user == null) {
    return (
      <div className="flex items-center gap-2">
        <Link href="/login" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          {t("nav_login")}
        </Link>
        <Link href="/signup" className="rounded-full px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">
          {t("nav_signup")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {navKeys.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              "rounded-full px-3 py-1.5 text-sm font-medium transition",
              active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100",
            ].join(" ")}
          >
            {t(item.key)}
          </Link>
        );
      })}
      <LogoutButton />
    </div>
  );
}
