/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
      screens: {
        sm: "640px",
        md: "768px",
        lg: "1024px",
        xl: "1280px",
      },
    },
    extend: {
      colors: {
        cream: {
          50: "#FFFBF5",
          100: "#FFF4E6",
          200: "#FFE7C7",
          300: "#FFD49E",
        },
        warm: {
          orange: "#FF8A4C",
          "orange-hover": "#F57533",
          mint: "#7ED7C1",
          "mint-hover": "#5EC7AE",
          rose: "#E85D5D",
          forest: "#4CAF7A",
        },
      },
      fontFamily: {
        display: [
          '"ZCOOL KuaiLe"',
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "sans-serif",
        ],
        body: [
          '"PingFang SC"',
          '"Microsoft YaHei"',
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(255, 138, 76, 0.15), 0 2px 8px -2px rgba(0, 0, 0, 0.06)",
        "card-hover":
          "0 8px 30px -6px rgba(255, 138, 76, 0.25), 0 4px 12px -4px rgba(0, 0, 0, 0.1)",
      },
      animation: {
        "fade-in-up": "fadeInUp 0.5s ease-out both",
        "fade-in": "fadeIn 0.4s ease-out both",
        "scale-in": "scaleIn 0.25s ease-out both",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: 0, transform: "translateY(16px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        scaleIn: {
          "0%": { opacity: 0, transform: "scale(0.95)" },
          "100%": { opacity: 1, transform: "scale(1)" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.7 },
        },
      },
      backgroundImage: {
        "cream-gradient":
          "linear-gradient(135deg, #FFFBF5 0%, #FFF4E6 50%, #FFEFE0 100%)",
        "warm-gradient":
          "linear-gradient(135deg, #FF8A4C 0%, #FFB088 100%)",
        "mint-gradient":
          "linear-gradient(135deg, #7ED7C1 0%, #A8E8D6 100%)",
      },
    },
  },
  plugins: [],
};
