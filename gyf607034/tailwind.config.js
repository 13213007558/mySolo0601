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
        ink: {
          50: '#F4F6FA',
          100: '#E5EAF2',
          200: '#C8D1E0',
          300: '#9AABC4',
          400: '#667C9E',
          500: '#3E5579',
          600: '#2A3F62',
          700: '#1E3A5F',
          800: '#162B4A',
          900: '#0E1E36',
        },
        amber: {
          50: '#FFF8EC',
          100: '#FFE8C2',
          500: '#D97706',
          600: '#B45309',
          700: '#92400E',
        },
        teal: {
          500: '#0F766E',
          600: '#0D655F',
        },
        rust: {
          500: '#B91C1C',
        },
        paper: {
          50: '#FBFCFD',
          100: '#F4F6F8',
          200: '#E9EDF1',
        }
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(14, 30, 54, 0.06), 0 1px 3px rgba(14, 30, 54, 0.08)',
        pop: '0 10px 30px rgba(14, 30, 54, 0.12)',
      },
      transitionDuration: {
        150: '150ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.35s ease-out',
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
