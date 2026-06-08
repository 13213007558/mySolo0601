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
        'deep-ocean': '#1E3A5F',
        'deep-ocean-light': '#2C5282',
        'aqua-teal': '#2DD4BF',
        'aqua-teal-dark': '#14B8A6',
        'warning-orange': '#F59E0B',
        'danger-red': '#EF4444',
        'slate-ink': '#1F2937',
        'slate-muted': '#4B5563',
        'slate-hint': '#9CA3AF',
        'slate-paper': '#F9FAFB',
        'slate-line': '#E5E7EB',
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(30, 58, 95, 0.08), 0 1px 2px rgba(30, 58, 95, 0.06)',
        'card-hover': '0 4px 12px rgba(30, 58, 95, 0.12), 0 2px 4px rgba(30, 58, 95, 0.08)',
        'glow': '0 0 0 3px rgba(45, 212, 191, 0.25)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shake': 'shake 0.4s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
    },
  },
  plugins: [],
};
