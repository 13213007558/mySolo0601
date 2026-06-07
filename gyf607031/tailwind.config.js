/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '2rem',
    },
    extend: {
      fontFamily: {
        display: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      colors: {
        ink: {
          50: '#f7f6f3',
          100: '#edeae3',
          200: '#d8d2c4',
          300: '#b8ad97',
          400: '#8f8368',
          500: '#6b604a',
          600: '#4d4535',
          700: '#363127',
          800: '#23201a',
          900: '#14120e',
        },
        sage: {
          50: '#f2f6f1',
          100: '#dce8d8',
          200: '#b8d1b0',
          300: '#8bb380',
          400: '#619454',
          500: '#437638',
          600: '#2f5829',
          700: '#244421',
          800: '#182f17',
          900: '#0e1d0e',
        },
        clay: {
          50: '#faf3ee',
          100: '#f1dfd1',
          200: '#e2bba0',
          300: '#cf926b',
          400: '#ba6e45',
          500: '#a05531',
          600: '#7e4127',
          700: '#5e3020',
          800: '#402018',
          900: '#27130e',
        },
        paper: {
          50: '#fcfbf7',
          100: '#f8f5ec',
          200: '#efe8d3',
        },
      },
      boxShadow: {
        'paper': '0 1px 2px rgba(54,49,39,0.04), 0 8px 24px rgba(54,49,39,0.06)',
        'paper-lg': '0 2px 8px rgba(54,49,39,0.06), 0 24px 64px rgba(54,49,39,0.08)',
      },
    },
  },
  plugins: [],
};
