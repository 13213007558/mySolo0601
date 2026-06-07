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
          50: "#FFFBF2",
          100: "#FFF5E1",
          200: "#FFEBC7",
        },
        milkgreen: {
          50: "#ECF7F1",
          100: "#C8E8D6",
          200: "#95D4B4",
          400: "#4CAF7A",
          500: "#3D9A68",
          600: "#2F7E54",
        },
        coral: {
          50: "#FFF1ED",
          100: "#FFD8CC",
          300: "#FF9C85",
          400: "#FF7A59",
          500: "#F25F3D",
        },
        mistblue: {
          200: "#B8CCDD",
          400: "#6B8BA8",
          500: "#54728C",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "-apple-system", "system-ui", "sans-serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out both",
        "timeline-dot": "timelineDot 0.4s ease-out both",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        timelineDot: {
          "0%": { transform: "scale(0)", opacity: "0" },
          "60%": { transform: "scale(1.2)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      boxShadow: {
        soft: "0 4px 20px rgba(76, 175, 122, 0.08)",
        card: "0 2px 16px rgba(107, 139, 168, 0.1)",
        pop: "0 8px 30px rgba(255, 122, 89, 0.18)",
      },
    },
  },
  plugins: [],
};
