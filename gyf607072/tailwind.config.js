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
          50: "#FDFBF7",
          100: "#FBF7F2",
          200: "#F5EDE2",
        },
        sage: {
          100: "#DCE8DE",
          300: "#9CC4A1",
          500: "#6BA372",
          700: "#4A7D52",
        },
        baby: {
          100: "#FDE4E4",
          300: "#F8B4B4",
          500: "#E88888",
        },
        sunset: {
          100: "#FBE4CC",
          300: "#F4A261",
          500: "#E76F51",
        },
        ink: {
          700: "#4A4540",
          800: "#332E2A",
          900: "#1F1C19",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Noto Sans SC"', "-apple-system", "sans-serif"],
      },
      boxShadow: {
        card: "0 2px 12px rgba(74, 69, 64, 0.06)",
        "card-hover": "0 6px 24px rgba(74, 69, 64, 0.12)",
      },
      borderRadius: {
        xl2: "14px",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
