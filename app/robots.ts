import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/noticias", "/editais", "/agenda-institucional", "/campus", "/transparencia", "/verificar-documento", "/publicacoes/"],
      disallow: ["/api/", "/auth/", "/login", "/recuperar-senha", "/nova-senha", "/buscar", "/gestao-academica", "/painel-institucional", "/usuarios", "/auditoria", "/monitoramento"],
    },
    sitemap: "https://sifcas.vercel.app/sitemap.xml",
    host: "https://sifcas.vercel.app",
  };
}
