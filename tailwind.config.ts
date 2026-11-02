import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {
    colors: {
      bayit: {
        cream: "#F6F2EA",
        sand: "#E8DDCC",
        paper: "#FFFEFB",
        brown: "#49372D",
        muted: "#8B7B6C",
        olive: "#788064",
        line: "#E7E0D6"
      }
    },
    boxShadow: { soft: "0 12px 40px rgba(73,55,45,.07)" }
  }},
  plugins: []
};
export default config;