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
          DEFAULT: "#F8B4C4",
          dark: "#E598AB",
          light: "#FFE4EC",
        },
        secondary: {
          DEFAULT: "#2D5A4D",
          dark: "#1E4238",
          light: "#4A7A6B",
        },
        cream: "#FFF8F3",
        warn: "#FFD93D",
        muted: "#E8E4E0",
      },
      fontFamily: {
        display: ['"LXGW WenKai"', '"霞鹜文楷"', "serif"],
        sans: ['"Source Han Sans"', '"思源黑体"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 2px 12px rgba(45,90,77,0.08)",
        card: "0 4px 20px rgba(45,90,77,0.1)",
      },
      borderRadius: {
        xl2: "14px",
      },
      keyframes: {
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      animation: {
        "fade-in-up": "fade-in-up 0.4s ease-out both",
        blink: "blink 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
