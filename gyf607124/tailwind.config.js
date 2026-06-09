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
          50: "#f0f5fa",
          100: "#dae6f2",
          200: "#b4cce5",
          300: "#84aad3",
          400: "#4d82bc",
          500: "#1e3a5f",
          600: "#1a3354",
          700: "#152a46",
          800: "#102138",
          900: "#0b182a",
        },
        industrial: {
          orange: "#f59e0b",
          green: "#10b981",
          red: "#ef4444",
          blue: "#3b82f6",
          gray: "#64748b",
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        industrial: "0 2px 8px rgba(30, 58, 95, 0.15)",
        "industrial-lg": "0 4px 16px rgba(30, 58, 95, 0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        slideIn: {
          "0%": { opacity: "0", transform: "translateY(-10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
