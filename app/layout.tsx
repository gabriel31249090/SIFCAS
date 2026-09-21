import type { Metadata } from "next";
import localFont from "next/font/local";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import "./auth.css";
import "./phase2.css";
import "./institutional.css";
import "./production.css";
import "./maisa.css";
import "./workspace.css";

const inter = localFont({ src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://sifcas.vercel.app"),
  applicationName: "SIFCAS",
  title: { default: "SIFCAS", template: "%s | SIFCAS" },
  description: "Sistema Integrado Federal de Campus, Administração e Serviços",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={inter.className}><AppShell>{children}</AppShell></body></html>;
}
