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
        teal: {
          50: "#F0F7F9",
          100: "#D6E8EC",
          200: "#ADD1D9",
          300: "#7FB4C0",
          400: "#4E8C9B",
          500: "#0F4C5C",
          600: "#0D4250",
          700: "#0A3540",
          800: "#072830",
          900: "#051B20",
        },
        amber: {
          50: "#FEF3EC",
          100: "#FBDFCB",
          200: "#F6BE97",
          300: "#F09A5E",
          400: "#E97D36",
          500: "#E36414",
          600: "#C5540E",
          700: "#9F420B",
          800: "#7A3208",
          900: "#552306",
        },
        cream: {
          50: "#FDFBF9",
          100: "#FBF7F4",
          200: "#F5EDE5",
          300: "#EEDFD0",
        },
        slate2: {
          400: "#7A8D93",
          500: "#5F747B",
          600: "#4A5D63",
          700: "#37464A",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px rgba(15, 76, 92, 0.06), 0 1px 2px rgba(15, 76, 92, 0.04)",
        cardHover: "0 6px 16px rgba(15, 76, 92, 0.10), 0 2px 6px rgba(15, 76, 92, 0.06)",
        lift: "0 -1px 0 rgba(15, 76, 92, 0.04), 0 8px 24px rgba(15, 76, 92, 0.10)",
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        drawLine: {
          "0%": { height: "0%" },
          "100%": { height: "100%" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeUp: "fadeUp 0.5s ease-out forwards",
        drawLine: "drawLine 0.6s ease-out forwards",
        countUp: "countUp 0.4s ease-out forwards",
      },
    },
  },
  plugins: [],
};
