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
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#94a3b8',
          300: '#64748b',
          400: '#475569',
          500: '#334155',
          600: '#1e293b',
          700: '#0f172a',
          800: '#0b1220',
          900: '#070b14',
        },
        amber: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        success: '#10b981',
        warn: '#f97316',
        danger: '#ef4444',
        paper: '#f8f5ef',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', '"Source Han Serif SC"', '"思源宋体"', 'serif'],
        sans: ['"Noto Sans SC"', '"Source Han Sans SC"', '"思源黑体"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px -6px rgba(15, 23, 42, 0.25)',
      },
      backgroundImage: {
        'paper-texture':
          "radial-gradient(1200px 600px at 10% 0%, rgba(245,158,11,0.06), transparent 60%), radial-gradient(900px 500px at 90% 100%, rgba(59,130,246,0.05), transparent 60%)",
      },
    },
  },
  plugins: [],
};
