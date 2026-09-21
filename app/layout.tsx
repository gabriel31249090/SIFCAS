import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
  title: { default: "SIFCAS — Campus Cáceres", template: "%s | SIFCAS" },
  description: "Sistema Integrado Federal de Campus, Administração e Serviços do Campus Cáceres.",
  category: "education",
  creator: "SIFCAS",
  publisher: "SIFCAS",
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: "/icon.png", apple: "/apple-icon.png" },
  manifest: "/manifest.webmanifest",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "SIFCAS",
    title: "SIFCAS — Campus Cáceres",
    description: "Vida acadêmica, serviços e informações institucionais em um só lugar.",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "SIFCAS — Campus Cáceres" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SIFCAS — Campus Cáceres",
    description: "Vida acadêmica, serviços e informações institucionais em um só lugar.",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className={inter.className}><AppShell>{children}</AppShell><Analytics /><SpeedInsights /></body></html>;
}
