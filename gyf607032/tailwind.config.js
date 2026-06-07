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
      fontFamily: {
        sans: ['"PingFang SC"', '"Noto Sans SC"', '"Microsoft YaHei"', 'system-ui', 'sans-serif'],
        display: ['"PingFang SC"', '"Noto Sans SC"', 'Georgia', 'serif'],
      },
      colors: {
        cream: {
          50: '#FFFBF5',
          100: '#FFF5E6',
          200: '#FFE9CC',
        },
        mint: {
          50: '#F0FBF6',
          100: '#D4F5E4',
          500: '#34B982',
          600: '#269968',
          700: '#1F7A54',
        },
        coral: {
          50: '#FFF1EE',
          100: '#FFDED6',
          500: '#FF7A66',
          600: '#F55945',
        },
        butter: {
          100: '#FFF4CC',
          500: '#F4C430',
        },
      },
      boxShadow: {
        soft: '0 2px 12px rgba(30, 41, 59, 0.06)',
        card: '0 4px 20px rgba(30, 41, 59, 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
