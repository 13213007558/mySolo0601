/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        cream: {
          50: '#FFFBF5',
          100: '#FFF7EC',
          200: '#FDEED8',
          300: '#FAE1BE',
        },
        warm: {
          50: '#FFF0E6',
          100: '#FFE0CC',
          200: '#FFC9A8',
          300: '#FFAA78',
          400: '#FF8F4F',
          500: '#F5702A',
          600: '#D95718',
        },
        sage: {
          50: '#F2F7F2',
          100: '#E3EFE2',
          200: '#C5DEC3',
          300: '#9FC69C',
          400: '#76AB73',
          500: '#558A52',
        },
        rose: {
          50: '#FFF1F2',
          100: '#FFE2E4',
          200: '#FFC7CC',
          300: '#FFA1AA',
          400: '#FF7282',
          500: '#F1495E',
        },
        ink: {
          900: '#2C1A0F',
          700: '#5C4434',
          500: '#8A7460',
          300: '#C4B4A3',
        },
      },
      fontFamily: {
        display: ['"PingFang SC"', '"Noto Serif SC"', 'Georgia', 'serif'],
        body: ['"PingFang SC"', '"Hiragino Sans GB"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 4px 24px -8px rgba(92, 68, 52, 0.12), 0 2px 6px -2px rgba(92, 68, 52, 0.06)',
        soft: '0 2px 12px -4px rgba(92, 68, 52, 0.08)',
      },
      borderRadius: {
        xl2: '1rem',
      },
    },
  },
  plugins: [],
};
