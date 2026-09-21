import { ImageResponse } from "next/og";

export const alt = "SIFCAS — Campus Cáceres";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", position: "relative", alignItems: "center", padding: "84px", color: "white", background: "linear-gradient(135deg, #0b3f36 0%, #0f5b4d 58%, #123b54 100%)", fontFamily: "Arial, sans-serif" }}>
      <div style={{ position: "absolute", width: 360, height: 360, borderRadius: 999, right: -80, top: -110, background: "rgba(221,169,41,.22)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 900 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <div style={{ width: 96, height: 96, borderRadius: 28, display: "flex", alignItems: "center", justifyContent: "center", color: "#17362f", background: "linear-gradient(135deg, #f1c24f, #d3980f)", fontSize: 48, fontWeight: 900 }}>S</div>
          <div style={{ display: "flex", flexDirection: "column" }}><span style={{ fontSize: 58, fontWeight: 900, letterSpacing: 2 }}>SIFCAS</span><span style={{ fontSize: 24, color: "#cce0da" }}>Campus Cáceres · Mato Grosso</span></div>
        </div>
        <div style={{ width: 120, height: 6, borderRadius: 999, background: "#dda929" }} />
        <div style={{ fontSize: 42, lineHeight: 1.18, fontWeight: 700 }}>Vida acadêmica, serviços e informação institucional em um só lugar.</div>
      </div>
    </div>,
    size,
  );
}
