import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {
    colors: {
      bayit: {
        cream: "#F8F9FC",
        sand: "#EEF1F7",
        paper: "#FFFFFF",
        brown: "#45485A",
        muted: "#85899A",
        olive: "#7D8BA6",
        line: "#E7EAF1",
        sky: "#A9C7E8",
        lavender: "#C5B8E8",
        rose: "#E9B9C5",
        peach: "#F0C6A8",
        butter: "#E9D99D",
        sage: "#B9C9B1",
        mint: "#A9D3C5"
      }
    },
    boxShadow: { soft: "0 12px 40px rgba(69,72,90,.07)" }
  }},
  plugins: []
};
export default config;
