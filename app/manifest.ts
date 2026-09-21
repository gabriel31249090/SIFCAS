import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SIFCAS — Campus Cáceres",
    short_name: "SIFCAS",
    description: "Sistema Integrado Federal de Campus, Administração e Serviços.",
    start_url: "/login",
    display: "standalone",
    background_color: "#f4f7f6",
    theme_color: "#0f5b4d",
    lang: "pt-BR",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
