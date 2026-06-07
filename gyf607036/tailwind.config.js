/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef7ee',
          100: '#fdedd3',
          200: '#fad7a6',
          300: '#f6ba6e',
          400: '#f19434',
          500: '#ee7712',
          600: '#df5d08',
          700: '#b94409',
          800: '#93360f',
          900: '#772e10',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf5eb',
          200: '#f5ebd6',
          300: '#eddbb6',
        },
        safety: {
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
        },
        warning: {
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
        },
        danger: {
          100: '#fee2e2',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        medical: {
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
        },
      },
      borderRadius: {
        card: '16px',
      },
      boxShadow: {
        card: '0 2px 8px -2px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)',
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'ui-serif', 'Georgia', 'serif'],
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};
