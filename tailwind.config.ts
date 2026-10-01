import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./index.html",
  ],
  prefix: "",
  safelist: ["bg-rainbow", "text-rainbow"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        display: ["Anton", "Impact", '"Arial Narrow"', "sans-serif"],
        label: ["Montserrat", '"Avenir Next"', "Arial", "sans-serif"],
        body: ["Figtree", '"Avenir Next"', '"Segoe UI"', "sans-serif"],
      },
      colors: {
        black: "var(--black)",
        brown: "var(--brown)",
        "brown-raised": "var(--brown-raised)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        border: "var(--border)",
        input: "var(--border)",
        ring: "var(--pink)",
        background: "var(--brown)",
        foreground: "var(--text)",
        numeral: "var(--numeral)",
        pink: "var(--pink)",
        "logo-pink": "var(--logo-pink)",
        "logo-yellow": "var(--logo-yellow)",
        primary: {
          DEFAULT: "var(--pink)",
          foreground: "#ffffff",
        },
        secondary: {
          DEFAULT: "var(--brown-raised)",
          foreground: "var(--text)",
        },
        destructive: {
          DEFAULT: "var(--pink)",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "var(--text-muted)",
          foreground: "var(--text-muted)",
        },
        accent: {
          DEFAULT: "var(--surface-2)",
          foreground: "var(--text)",
        },
        popover: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
        card: {
          DEFAULT: "var(--surface)",
          foreground: "var(--text)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
