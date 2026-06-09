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
        primary: {
          DEFAULT: '#165DFF',
          dark: '#0E42D2',
        },
        alert: {
          red: '#F53F3F',
          orange: '#FF7D00',
          green: '#00B42A',
        },
        industrial: {
          bg: '#1D2129',
          card: '#2A2F3A',
          border: '#3D4250',
          text: '#F2F3F5',
          muted: '#86909C',
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
        sans: ['"Noto Sans SC"', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'expand': 'expand 0.3s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        expand: {
          '0%': { maxHeight: '0', opacity: '0' },
          '100%': { maxHeight: '1000px', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
