"use client";
import { useState, useTransition } from "react";
import { signIn } from "@/app/actions";
import { LanguagePicker, useLanguage } from "./language";
import type { Message } from "@/lib/i18n";
export function Login({
  configured,
  profileMissing,
}: {
  configured: boolean;
  profileMissing: boolean;
}) {
  const { t } = useLanguage();
  const [error, setError] = useState<Message | undefined>(
    profileMissing ? "Profile missing" : undefined,
  );
  const [pending, start] = useTransition();
  return (
    <main className="login">
      <section className="login-brand">
        <span className="eyebrow">REAL FIGHT / TOURNAMENT MANAGER</span>
        <h1>
          EVERY FIGHT.
          <br />
          <em>ONE SYSTEM.</em>
        </h1>
        <div className="ring-art" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </section>
      <section className="login-panel">
        <LanguagePicker />
        <div className="login-form">
          <div className="brand">
            REAL<span>FIGHT</span>
            <small>TOURNAMENT MANAGER</small>
          </div>
          <h2>{t(configured ? "Sign in" : "Configuration required")}</h2>
          <p>{t(configured ? "Login description" : "Setup description")}</p>
          {configured && (
            <form
              action={(form) =>
                start(async () => {
                  try {
                    const result = await signIn(form);
                    if (result) setError(result.error);
                  } catch {
                    setError("Login failed");
                  }
                })
              }
            >
              <label>
                {t("Email")}
                <input
                  type="email"
                  name="email"
                  required
                  autoComplete="username"
                />
              </label>
              <label>
                {t("Password")}
                <input
                  type="password"
                  name="password"
                  required
                  autoComplete="current-password"
                  maxLength={200}
                />
              </label>
              {error && (
                <div className="notice error" role="alert">
                  {t(error)}
                </div>
              )}
              <button className="primary" disabled={pending}>
                {t(pending ? "Loading" : "Sign in")} →
              </button>
            </form>
          )}
          <p className="muted">{t("Account help")}</p>
        </div>
        <footer>REAL FIGHT © {new Date().getFullYear()}</footer>
      </section>
    </main>
  );
}
