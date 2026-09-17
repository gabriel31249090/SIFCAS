import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppShell } from "@/components/AppShell";
import "./globals.css";
import "./auth.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "SIFCAS", template: "%s | SIFCAS" },
  description: "Sistema Integrado Federal de Campus, Administração e Serviços",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={inter.className}><AppShell>{children}</AppShell></body></html>;
}
