import type { MetadataRoute } from "next";

const publicRoutes = [
  { path: "/noticias", priority: 1, changeFrequency: "daily" as const },
  { path: "/editais", priority: 0.9, changeFrequency: "daily" as const },
  { path: "/agenda-institucional", priority: 0.8, changeFrequency: "daily" as const },
  { path: "/campus", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/transparencia", priority: 0.7, changeFrequency: "weekly" as const },
  { path: "/verificar-documento", priority: 0.5, changeFrequency: "monthly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return publicRoutes.map((route) => ({
    url: `https://sifcas.vercel.app${route.path}`,
    priority: route.priority,
    changeFrequency: route.changeFrequency,
  }));
}
