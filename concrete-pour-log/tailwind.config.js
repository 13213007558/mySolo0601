/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        concrete: {
          50: '#f6f7f9',
          100: '#eceff3',
          200: '#d5dae3',
          300: '#b0bac9',
          400: '#8593a8',
          500: '#65758c',
          600: '#505e73',
          700: '#424d5e',
          800: '#39424f',
          900: '#333944',
          950: '#20242c'
        },
        accent: {
          DEFAULT: '#d97706',
          light: '#f59e0b',
          dark: '#b45309'
        },
        pour: {
          start: '#10b981',
          end: '#ef4444',
          warning: '#f59e0b',
          info: '#3b82f6'
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [],
}
