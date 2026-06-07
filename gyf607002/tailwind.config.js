/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        ink: {
          DEFAULT: '#1F4D3D',
          dark: '#153328',
          light: '#2F6B55',
        },
        warm: {
          DEFAULT: '#E8A87C',
          dark: '#C78A5E',
          light: '#F3C9A8',
        },
        cream: {
          DEFAULT: '#F5F1EA',
          dark: '#E8E2D6',
        },
        status: {
          normal: '#3A7D5C',
          abnormal: '#C25B56',
          pending: '#D4915A',
          supplemented: '#4A6FA5',
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 4px 20px rgba(31, 77, 61, 0.08)',
        card: '0 2px 12px rgba(31, 77, 61, 0.06)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'fade-in-slow': 'fadeIn 0.6s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
