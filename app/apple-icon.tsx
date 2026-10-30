import { ImageResponse } from "next/og";

export const size = { width: 1024, height: 1024 };
export const contentType = "image/png";

/**
 * Apple home screens need a PNG apple-touch-icon. SVG works for Android,
 * but Safari can rasterize it with an unexpectedly small text mark.
 */
export default function AppleIcon() {
  return new ImageResponse(
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#ffffff",
      color: "#171717",
      fontFamily: "Arial, Helvetica, sans-serif",
      fontSize: 180,
      fontWeight: 400,
      letterSpacing: "-10px",
      paddingBottom: 5,
    }}>
      by.alinkins
    </div>,
    { ...size },
  );
}
