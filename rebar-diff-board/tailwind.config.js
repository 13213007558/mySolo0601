/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        rebar: {
          orange: '#F97316',
          'orange-dark': '#EA580C',
          blue: '#1E3A8A',
          'blue-light': '#3B82F6',
          green: '#059669',
          red: '#DC2626',
          yellow: '#D97706',
          gray: '#6B7280'
        }
      }
    }
  },
  plugins: []
}
