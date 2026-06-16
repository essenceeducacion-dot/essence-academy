import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Identidad de marca Essence
        marino: {
          DEFAULT: "#0f1b2d",
          900: "#0b1422",
          800: "#0f1b2d",
          700: "#16263d",
          600: "#1f3553",
          500: "#2c476b",
        },
        dorado: {
          DEFAULT: "#c9a24a",
          600: "#b48d38",
          500: "#c9a24a",
          400: "#d8b76a",
          300: "#e6cd95",
        },
        crema: "#f6f1e7",
      },
      fontFamily: {
        // Variables inyectadas por next/font en el layout
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
