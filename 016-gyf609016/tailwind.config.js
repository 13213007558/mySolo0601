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
        terracotta: '#C4704A',
        stone: '#8B8680',
      },
    },
  },
  plugins: [],
};
