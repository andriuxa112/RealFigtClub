import type { Metadata } from "next";
import { LanguageProvider } from "@/components/language";
import "./globals.css";
export const metadata: Metadata = {
  title: "REAL FIGHT | Tournament Manager",
  description: "Kovos sporto varžybų, klubų ir registracijų valdymas",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="lt">
      <body>
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
