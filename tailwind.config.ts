import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        dusk: "#161A22",
        charcoal: "#1F2430",
        ember: "#E8633A",
        embersoft: "#F2865F",
        gold: "#D9A441",
        parchment: "#F2EDE4",
        haze: "#8B93A6",
        surface: "#FFFFFF",
        surfacealt: "#F7F7F5",
        ink: "#111111",
        inkmuted: "#666666",
        inksoft: "#999999",
        line: "#EEEEEE",
        brand: "#99CC02",
        branddark: "#7AA002",
        brandink: "#1C2400",
      },
      fontFamily: {
        display: ["var(--font-fraunces)"],
        body: ["var(--font-inter)"],
      },
      backgroundImage: {
        "ember-glow":
          "radial-gradient(circle at 50% 0%, rgba(232,99,58,0.25), rgba(22,26,34,0) 60%)",
      },
    },
  },
  plugins: [],
};
export default config;
