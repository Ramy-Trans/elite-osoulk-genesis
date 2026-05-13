import { createContext, useContext, useState, useEffect } from "react";
import { translations } from "./i18n";

export type Lang = "ar" | "en";

interface LangContextValue {
  lang: Lang;
  toggle: () => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const LangContext = createContext<LangContextValue>({
  lang: "ar",
  toggle: () => {},
  t: (k) => k,
  dir: "rtl",
});

export function useLang() {
  return useContext(LangContext);
}

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("osoulk_lang") as Lang) || "ar";
    }
    return "ar";
  });

  const dir = lang === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.documentElement.style.fontFamily = lang === "ar"
      ? "'Cairo', 'Tajawal', sans-serif"
      : "";
  }, [lang, dir]);

  function toggle() {
    const next: Lang = lang === "ar" ? "en" : "ar";
    setLang(next);
    localStorage.setItem("osoulk_lang", next);
  }

  function t(key: string): string {
    return translations[lang][key] ?? translations["en"][key] ?? key;
  }

  return (
    <LangContext.Provider value={{ lang, toggle, t, dir }}>
      {children}
    </LangContext.Provider>
  );
}
