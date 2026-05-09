import { ImageResponse } from "next/og";

export const alt = "Sayor Motors — B2B запчасти BMW";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #1e3a8a 0%, #1e293b 100%)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          color: "#ffffff",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: -2,
            lineHeight: 1,
          }}
        >
          SAYOR MOTORS
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 36,
            fontWeight: 500,
            color: "#cbd5e1",
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          B2B-каталог запчастей BMW · BMW Motorrad · China-made BMW
        </div>
        <div
          style={{
            marginTop: 60,
            display: "flex",
            gap: 24,
            fontSize: 24,
            color: "#94a3b8",
          }}
        >
          <div>Параллельный импорт · Опт</div>
          <div style={{ color: "#475569" }}>·</div>
          <div>Проверка артикулов за минуты</div>
        </div>
      </div>
    ),
    { ...size },
  );
}
