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
        night: {
          50: "#f1f5f9",
          100: "#e2e8f0",
          200: "#94a3b8",
          300: "#64748b",
          400: "#475569",
          500: "#334155",
          600: "#1e293b",
          700: "#0f172a",
          800: "#0b1220",
          900: "#070b15",
        },
        pickup: {
          normal: "#10b981",
          phone: "#3b82f6",
          aunt: "#8b5cf6",
          exception: "#f59e0b",
          withdrawn: "#ef4444",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"思源宋体"', 'serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', 'Menlo', 'monospace'],
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shake': 'shake 0.3s ease-in-out',
        'flash': 'flash 0.8s ease-in-out',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shake: {
          '0%, 100%': { transform: 'translateY(0)' },
          '25%': { transform: 'translateY(-2px)' },
          '75%': { transform: 'translateY(2px)' },
        },
        flash: {
          '0%, 100%': { backgroundColor: 'transparent' },
          '50%': { backgroundColor: 'rgba(16, 185, 129, 0.2)' },
        },
      },
    },
  },
  plugins: [],
};
