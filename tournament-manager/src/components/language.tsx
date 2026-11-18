"use client";
import {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { translate, type Locale, type Message } from "@/lib/i18n";
const LanguageContext = createContext<{
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: Message) => string;
}>({
  locale: "lt" as Locale,
  setLocale: () => {},
  t: (key: Message): string => translate("lt", key),
});
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("rf-language", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("rf-language", callback);
  };
}
function snapshot(): Locale {
  try {
    const value = localStorage.getItem("rf-language");
    return value === "ru" || value === "en" ? value : "lt";
  } catch {
    return "lt";
  }
}
export function LanguageProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, snapshot, (): Locale => "lt");
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  function change(value: Locale) {
    localStorage.setItem("rf-language", value);
    window.dispatchEvent(new Event("rf-language"));
  }
  return (
    <LanguageContext.Provider
      value={{ locale, setLocale: change, t: (key) => translate(locale, key) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
export const useLanguage = () => useContext(LanguageContext);
export function LanguagePicker() {
  const { locale, setLocale } = useLanguage();
  return (
    <select
      aria-label="Language"
      className="language"
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
    >
      <option value="lt">LT</option>
      <option value="ru">RU</option>
      <option value="en">EN</option>
    </select>
  );
}
