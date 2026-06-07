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
          DEFAULT: '#0D7377',
          50: '#E6F4F4',
          100: '#CCE8E9',
          200: '#99D1D3',
          300: '#66BABD',
          400: '#33A3A7',
          500: '#0D7377',
          600: '#0A5C5F',
          700: '#084547',
          800: '#052E30',
          900: '#031718',
        },
        accent: {
          orange: '#E8873A',
          green: '#2E8B57',
        },
        bgcream: '#F5F5F0',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        'serif-sc': ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
