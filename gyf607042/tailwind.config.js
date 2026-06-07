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
        sage: {
          50: "#F3F6F0",
          100: "#E4EBDF",
          200: "#C8D6BE",
          300: "#A7BFA0",
          400: "#87A878",
          500: "#6B8C5C",
          600: "#536B47",
        },
        coral: {
          50: "#FBEFEB",
          100: "#F6DBD3",
          200: "#EEB7A8",
          300: "#E8998D",
          400: "#DC735E",
          500: "#C95A44",
        },
        amber2: {
          500: "#C17817",
          600: "#9E610F",
        },
        cream: "#FAF7F2",
        warm: {
          50: "#FBFAF8",
          100: "#F3EFE9",
          200: "#E5DED4",
          500: "#6B6560",
          700: "#4A4744",
          900: "#2C2A28",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(44, 42, 40, 0.06), 0 8px 24px rgba(44, 42, 40, 0.04)',
        card: '0 4px 16px rgba(44, 42, 40, 0.08)',
      },
      borderRadius: {
        xl2: '14px',
      },
    },
  },
  plugins: [],
};
