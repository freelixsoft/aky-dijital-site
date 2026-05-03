import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#07080a",
          900: "#0d1016",
          850: "#121821",
          800: "#17202b"
        },
        fog: {
          50: "#f7fafc",
          100: "#edf2f7",
          200: "#d8e0ea",
          400: "#9aa8b8",
          500: "#78889a"
        },
        electric: "#36b7ff",
        acid: "#b7ff3c",
        ember: "#ff7a3d",
        pulse: "#8d6bff"
      },
      fontFamily: {
        sans: [
          "Inter",
          "Manrope",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif"
        ]
      },
      boxShadow: {
        glow: "0 0 36px rgba(54, 183, 255, 0.22)",
        acid: "0 0 28px rgba(183, 255, 60, 0.18)"
      },
      backgroundImage: {
        "grid-lines":
          "linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px)",
        "signal-lines":
          "repeating-linear-gradient(90deg, rgba(54,183,255,0.14) 0 1px, transparent 1px 82px)"
      }
    }
  },
  plugins: []
};

export default config;
