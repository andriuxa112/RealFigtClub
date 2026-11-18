"use client";
import { useLanguage } from "@/components/language";
export default function ErrorPage({ reset }: { reset: () => void }) {
  const { t } = useLanguage();
  return (
    <main className="error-page">
      <h1>{t("Data unavailable")}</h1>
      <button onClick={reset}>{t("Back")}</button>
    </main>
  );
}
