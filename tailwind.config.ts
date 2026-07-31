import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14161A",
        panel: "#1E2127",
        panelLight: "#262A32",
        hairline: "#33383F",
        gold: "#E8A33D",
        goldDim: "#8A6A2E",
        live: "#4CAF7D",
        textPrimary: "#F2F0EA",
        textMuted: "#8A8F98",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        body: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
