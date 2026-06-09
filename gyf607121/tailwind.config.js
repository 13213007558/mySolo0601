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
      colors: {
        primary: {
          50: '#E8F3FF',
          100: '#BEDAFF',
          200: '#94BFFF',
          300: '#6AA3FF',
          400: '#4080FF',
          500: '#165DFF',
          600: '#0E42D2',
          700: '#0A2BA6',
          800: '#061D79',
          900: '#03114D',
        },
        industrial: {
          bg: '#0F1115',
          card: '#1A1D23',
          border: '#2A2F38',
          hover: '#252931',
        },
        status: {
          success: '#00B42A',
          warning: '#FF7D00',
          danger: '#F53F3F',
          info: '#165DFF',
          purple: '#722ED1',
          orange: '#FF9A2E',
        },
      },
      fontFamily: {
        sans: ['"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        'card': '0 4px 20px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 8px 30px rgba(0, 0, 0, 0.4)',
        'glow': '0 0 20px rgba(22, 93, 255, 0.3)',
        'glow-success': '0 0 20px rgba(0, 180, 42, 0.3)',
        'glow-warning': '0 0 20px rgba(255, 125, 0, 0.3)',
        'glow-danger': '0 0 20px rgba(245, 63, 63, 0.3)',
      },
      backgroundImage: {
        'gradient-card': 'linear-gradient(145deg, rgba(26, 29, 35, 0.9) 0%, rgba(15, 17, 21, 0.95) 100%)',
        'gradient-primary': 'linear-gradient(135deg, #165DFF 0%, #0E42D2 100%)',
        'gradient-success': 'linear-gradient(135deg, #00B42A 0%, #009A23 100%)',
        'gradient-warning': 'linear-gradient(135deg, #FF7D00 0%, #FF9A2E 100%)',
        'gradient-danger': 'linear-gradient(135deg, #F53F3F 0%, #D92D2D 100%)',
        'grid-pattern': 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.05) 1px, transparent 0)',
      },
      backgroundSize: {
        'grid': '24px 24px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
