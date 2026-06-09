/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: "#f0f5ff",
          100: "#e0ebff",
          200: "#b9d3ff",
          300: "#7cabff",
          400: "#3a7bff",
          500: "#0F3460",
          600: "#0a2648",
          700: "#081d38",
          800: "#06182e",
          900: "#040f1e",
        },
        accent: {
          orange: "#E94560",
          green: "#16C79A",
          yellow: "#FFC93C",
          gold: "#D4AF37",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        card: "0 4px 20px -2px rgba(15, 52, 96, 0.15)",
        hover: "0 8px 30px -4px rgba(15, 52, 96, 0.25)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-down": "slideDown 0.3s ease-out forwards",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", maxHeight: "0" },
          "100%": { opacity: "1", maxHeight: "1000px" },
        },
      },
    },
  },
  plugins: [],
};
