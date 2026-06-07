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
        'ink-blue': {
          50: '#EEF2F7',
          100: '#D6DFEA',
          200: '#A9BBD1',
          300: '#7A94B6',
          400: '#4F6F9B',
          500: '#2E4F7A',
          600: '#1E3A5F',
          700: '#172E4B',
          800: '#112238',
          900: '#0B1726',
        },
        'warm-white': '#FAF7F2',
        'cream': '#F5F0E8',
        'status': {
          green: '#2D8659',
          'green-light': '#E6F3EC',
          orange: '#D9822B',
          'orange-light': '#FBF0E3',
          red: '#C63737',
          'red-light': '#FBE8E8',
          gray: '#6B7280',
          'gray-light': '#F3F4F6',
          yellow: '#CA8A04',
          'yellow-light': '#FEF7D9',
        },
      },
      fontFamily: {
        'serif-cn': ['"Noto Serif SC"', '"Source Han Serif SC"', '"PingFang SC"', 'serif'],
        'sans-cn': ['"Noto Sans SC"', '"Source Han Sans SC"', '"PingFang SC"', 'sans-serif'],
        'mono-num': ['"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(30, 58, 95, 0.06), 0 1px 2px rgba(30, 58, 95, 0.04)',
        'card-hover': '0 4px 12px rgba(30, 58, 95, 0.08), 0 2px 4px rgba(30, 58, 95, 0.04)',
      },
      borderRadius: {
        'lg': '8px',
      },
      animation: {
        'shake': 'shake 0.4s ease-in-out',
      },
      keyframes: {
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-3px)' },
          '40%, 80%': { transform: 'translateX(3px)' },
        },
      },
    },
  },
  plugins: [],
};
