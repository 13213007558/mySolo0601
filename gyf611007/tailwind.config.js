/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./views/**/*.html", "./api/**/*.ts"],
  theme: {
    extend: {
      colors: {
        amber: {
          50: "#FBF5EE",
          100: "#F5E9D9",
          200: "#E8D0B0",
          300: "#D9B485",
          400: "#C8956C",
          500: "#B57A4F",
          600: "#966140",
          700: "#754A31",
          800: "#543523",
          900: "#332015",
        },
        charcoal: {
          50: "#E8DDD0",
          100: "#C5B8A8",
          200: "#9A8E7F",
          300: "#6A6257",
          400: "#3A3430",
          500: "#2A2420",
          600: "#1F1B18",
          700: "#1A1614",
          800: "#12100F",
          900: "#0A0908",
        },
        tea: {
          50: "#F1F7F2",
          100: "#DCEBE0",
          200: "#B4D6BC",
          300: "#86BE93",
          400: "#4A7C59",
          500: "#3A6347",
          600: "#2D4E38",
          700: "#203829",
        },
        copper: {
          50: "#F7EFEC",
          100: "#EED9D0",
          200: "#DBAF9D",
          300: "#C4846B",
          400: "#A0522D",
          500: "#834325",
          600: "#65331C",
          700: "#472313",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(200, 149, 108, 0.3)",
        "glow-lg": "0 0 40px rgba(200, 149, 108, 0.4)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        shimmer: "shimmer 2s linear infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
    },
  },
  plugins: [],
};
