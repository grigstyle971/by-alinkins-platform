import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "by.alinkins workout programs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://alinkinscodex.vercel.app";

export default function OpenGraphImage() {
  const heroImage = new URL("/images/hero-original.JPEG", siteUrl).toString();

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          overflow: "hidden",
          background: "#1d2e3e",
          color: "#fff",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <img
          alt=""
          src={heroImage}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 53%" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(8,18,26,.72), rgba(8,18,26,.2) 72%, rgba(8,18,26,.36))" }} />
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "58px 68px", position: "relative", width: "100%" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700, letterSpacing: -1 }}>by.alinkins</div>
          <div style={{ display: "flex", maxWidth: 620, fontSize: 67, lineHeight: 1.04, fontWeight: 700, letterSpacing: -2.5 }}>step into your dream body era!</div>
          <div style={{ display: "flex", fontSize: 21, fontWeight: 700, letterSpacing: 3 }}>WORKOUT PROGRAMS</div>
        </div>
      </div>
    ),
    size,
  );
}
