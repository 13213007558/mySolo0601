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
        brand: {
          50: '#eef3f9',
          100: '#d5e2ed',
          200: '#adc5db',
          300: '#7ca2c3',
          400: '#4e7ea9',
          500: '#1E3A5F',
          600: '#1a3352',
          700: '#142940',
          800: '#0f1f30',
          900: '#0a1621',
        },
        health: {
          normal: '#81C784',
          normalLight: '#e8f5e9',
          abnormal: '#E57373',
          abnormalLight: '#ffebee',
          pending: '#FFB74D',
          pendingLight: '#fff3e0',
          leave: '#64B5F6',
          leaveLight: '#e3f2fd',
        },
      },
      fontFamily: {
        display: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(30, 58, 95, 0.08)',
        cardHover: '0 8px 24px rgba(30, 58, 95, 0.12)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
