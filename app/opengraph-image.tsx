import { ImageResponse } from "next/og";

export const alt = "UniShare – Campus Rental Platform";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#f8f9ff",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px",
        fontFamily: "Inter, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "white",
          borderRadius: "24px",
          padding: "48px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
        }}
      >
        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: "#b12c16",
            marginBottom: 16,
            letterSpacing: "-0.02em",
          }}
        >
          UniShare
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#0b1c30",
            textAlign: "center",
            maxWidth: "80%",
          }}
        >
          Campus gear rental. Made simple.
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            color: "#5a413c",
            textAlign: "center",
          }}
        >
          Rent calculators, cameras, furniture, and more from your fellow
          students.
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}
