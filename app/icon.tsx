import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64
};

export const contentType = "image/png";

export default function Icon(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0b0f15",
          color: "#f2ece2",
          borderRadius: "14px",
          border: "1px solid rgba(242,236,226,0.16)",
          fontSize: 30,
          fontWeight: 600
        }}
      >
        SR
      </div>
    ),
    size
  );
}
