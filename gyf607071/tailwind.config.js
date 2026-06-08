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
        medical: {
          50: "#F0F7F9",
          100: "#E0EFF4",
          200: "#B8DCE6",
          300: "#8FC7D8",
          400: "#6CB3CB",
          500: "#4A90A4",
          600: "#3D7889",
          700: "#30606E",
          800: "#244852",
          900: "#183037",
        },
        baby: {
          50: "#FFF5F5",
          100: "#FFEBEB",
          200: "#FCD7D7",
          300: "#FAC3C3",
          400: "#F9AFAF",
          500: "#F8B4B4",
          600: "#E89A9A",
          700: "#D88080",
          800: "#C86666",
          900: "#B84C4C",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'serif'],
        sans: ['"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
};
