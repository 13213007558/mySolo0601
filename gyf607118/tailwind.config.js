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
          DEFAULT: "#165DFF",
          50: "#E8F3FF",
          100: "#B9D8FF",
          200: "#8ABDFF",
          300: "#5BA2FF",
          400: "#2D87FF",
          500: "#165DFF",
          600: "#0E42D2",
          700: "#0A2BA0",
          800: "#06196E",
          900: "#030C3C",
        },
        warning: {
          DEFAULT: "#FF7D00",
          50: "#FFF3E8",
          100: "#FFD9B3",
          200: "#FFBF80",
          300: "#FFA64D",
          400: "#FF8C1A",
          500: "#FF7D00",
          600: "#CC6400",
          700: "#994B00",
          800: "#663200",
          900: "#331900",
        },
        success: {
          DEFAULT: "#00B42A",
          50: "#E8FFEE",
          100: "#B3FFC4",
          200: "#80FF9B",
          300: "#4DFF71",
          400: "#1AFF48",
          500: "#00B42A",
          600: "#009022",
          700: "#006C19",
          800: "#004811",
          900: "#002408",
        },
        industrial: {
          50: "#F2F3F5",
          100: "#E5E6EB",
          200: "#C9CDD4",
          300: "#86909C",
          400: "#4E5969",
          500: "#1D2129",
          600: "#171A1F",
          700: "#101216",
          800: "#0A0B0E",
          900: "#050507",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
        sans: ["PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scanLine 2s linear infinite",
        "glow-orange": "glowOrange 2s ease-in-out infinite",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        glowOrange: {
          "0%, 100%": { boxShadow: "0 0 5px #FF7D00, 0 0 10px #FF7D00" },
          "50%": { boxShadow: "0 0 15px #FF7D00, 0 0 25px #FF7D00" },
        },
      },
    },
  },
  plugins: [],
};
