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
        medical: {
          50: "#f0f9f4",
          100: "#dcf1e5",
          200: "#bbe3cb",
          300: "#8ecca9",
          400: "#5caf83",
          500: "#3a9367",
          600: "#287652",
          700: "#1a6b4a",
          800: "#174f39",
          900: "#144130",
        },
        status: {
          normal: "#22c55e",
          abnormal: "#f97316",
          revised: "#6366f1",
          manual: "#d97706",
        },
        paper: "#fafaf7",
      },
      fontFamily: {
        serif: [
          "Noto Serif SC",
          "Source Han Serif CN",
          "Songti SC",
          "SimSun",
          "serif",
        ],
        sans: [
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        cardHover:
          "0 10px 20px -5px rgba(26, 107, 74, 0.1), 0 6px 10px -6px rgba(26, 107, 74, 0.08)",
      },
      borderRadius: {
        xl: "10px",
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
