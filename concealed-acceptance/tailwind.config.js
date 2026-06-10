/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        concealed: {
          orange: '#F59E0B',
          orangeDark: '#D97706',
          blue: '#1E3A8A',
          blueDark: '#1E40AF',
          green: '#059669',
          red: '#DC2626',
          yellow: '#D97706',
          gray: '#6B7280',
          grayDark: '#374151'
        }
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: [],
}
