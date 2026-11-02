import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#F7F6F2", borderRadius: 112 }}>
      <svg width="390" height="390" viewBox="0 0 512 512" fill="none">
        <g stroke="#56758F" strokeWidth="25" strokeLinecap="round" strokeLinejoin="round">
          <path d="M70 260V180L166 98L262 180V260" />
          <path d="M250 260V180L346 98L442 180V260" />
          <path d="M150 372V245L256 154L362 245V372" />
        </g>
        <g fill="#8EABC1">
          <rect x="226" y="274" width="26" height="26" rx="6" />
          <rect x="260" y="274" width="26" height="26" rx="6" />
          <rect x="226" y="308" width="26" height="26" rx="6" />
          <rect x="260" y="308" width="26" height="26" rx="6" />
        </g>
      </svg>
    </div>,
    { ...size }
  );
}
