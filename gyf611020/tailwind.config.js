/** @type {import('tailwindcss').Config} */

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    container: {
      center: true,
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
    },
    extend: {
      colors: {
        parchment: {
          50: '#FDF8EC',
          100: '#F5EFE0',
          200: '#EFE5CF',
          300: '#E0D0AB',
          400: '#D4B887',
          500: '#C97F30',
        },
        ink: {
          DEFAULT: '#3B2F2F',
          light: '#5C4522',
          muted: '#8B6B3D',
        },
        cinnabar: '#B23A48',
        mineral: '#2D5A7B',
        bamboo: '#5A7B2D',
      },
      fontFamily: {
        wenkai: ['LXGW WenKai', 'serif'],
        serifsc: ['Noto Serif SC', 'serif'],
        hansans: ['Source Han Sans', 'sans-serif'],
      },
      boxShadow: {
        scroll: '0 10px 30px -10px rgba(59, 47, 47, 0.15)',
      },
    },
  },
  plugins: [],
};
