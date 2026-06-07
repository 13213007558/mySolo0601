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
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#0EA5A0",
          600: "#0F766E",
          700: "#115E59",
          800: "#134E4A",
          900: "#042F2E",
        },
        warm: {
          50: "#FEFCE8",
          100: "#FEF9C3",
          200: "#FEF08A",
          300: "#FDE047",
          400: "#FACC15",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"思源宋体"', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', '"思源黑体"', 'sans-serif'],
      },
      boxShadow: {
        'inset-medical': 'inset 0 2px 0 rgba(255,255,255,0.3), inset 0 -2px 0 rgba(0,0,0,0.1)',
        'soft': '0 2px 12px rgba(14, 165, 160, 0.08)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.06)',
      },
      keyframes: {
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.5', transform: 'scale(1.3)' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'dissolve': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in-up': 'fade-in-up 0.4s ease-out forwards',
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'dissolve': 'dissolve 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
