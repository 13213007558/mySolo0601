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
        cream: {
          50: "#FFFDF9",
          100: "#FFF8F0",
          200: "#FDEFD9",
          300: "#F9E0BE",
        },
        brand: {
          50: "#FDE7EF",
          100: "#FBCFDD",
          200: "#F7A8C3",
          300: "#F48FB1",
          400: "#EF6C9C",
          500: "#E94E87",
          600: "#D6336C",
        },
        status: {
          normal: "#66BB6A",
          pending: "#FFA726",
          danger: "#EF5350",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(244, 143, 177, 0.08)",
        card: "0 2px 12px rgba(55, 71, 79, 0.06)",
      },
      borderRadius: {
        card: "12px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
