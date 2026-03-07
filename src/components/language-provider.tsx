"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { getT, type Lang } from "@/lib/i18n";

const StorageKey = "coco-lang";

type ContextValue = { lang: Lang; setLang: (l: Lang) => void; t: (key: string) => string };

const Context = createContext<ContextValue | null>(null);

export function useLanguage() {
  const v = useContext(Context);
  if (!v) return { lang: "ja" as Lang, setLang: () => {}, t: getT("ja") };
  return v;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ja");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(StorageKey) as Lang | null;
      if (stored && (stored === "ja" || stored === "en" || stored === "si")) setLangState(stored);
    } catch {}
  }, []);

  function setLang(l: Lang) {
    setLangState(l);
    try {
      localStorage.setItem(StorageKey, l);
    } catch {}
  }

  const t = getT(lang);
  return (
    <Context.Provider value={{ lang, setLang, t }}>
      {children}
    </Context.Provider>
  );
}
