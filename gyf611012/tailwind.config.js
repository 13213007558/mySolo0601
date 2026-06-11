/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'Menlo', 'monospace'],
      },
      colors: {
        saffron: {
          50: '#FDF2F2',
          100: '#F9D6D6',
          200: '#F3ADAD',
          300: '#EB7878',
          400: '#E03E3E',
          500: '#DC143C',
          600: '#CD2626',
          700: '#B22222',
          800: '#8B0000',
          900: '#5C0000',
        },
        gold: {
          400: '#E6C85C',
          500: '#D4AF37',
          600: '#B8960C',
        },
        ink: {
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
          950: '#030712',
        },
      },
      boxShadow: {
        'btn': '0 4px 0 0 rgba(0,0,0,0.25)',
        'btn-pressed': '0 1px 0 0 rgba(0,0,0,0.25)',
        'card': '0 8px 24px -8px rgba(139,0,0,0.2)',
        'gold-glow': '0 0 24px 4px rgba(212,175,55,0.35)',
      },
      animation: {
        'pulse-gold': 'pulse-gold 1.5s ease-in-out infinite',
        'breathe-led': 'breathe-led 3s ease-in-out infinite',
        'shake': 'shake 0.4s ease-in-out',
        'stamp': 'stamp 0.35s ease-out forwards',
        'blink-critical': 'blink-critical 1s ease-in-out infinite',
        'scan-line': 'scan-line 2.5s linear infinite',
      },
      keyframes: {
        'pulse-gold': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,175,55,0.5)', borderWidth: '3px' },
          '50%': { boxShadow: '0 0 0 8px rgba(212,175,55,0)', borderWidth: '4px' },
        },
        'breathe-led': {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
        'shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%': { transform: 'translateX(-4px)' },
          '40%': { transform: 'translateX(4px)' },
          '60%': { transform: 'translateX(-3px)' },
          '80%': { transform: 'translateX(3px)' },
        },
        'stamp': {
          '0%': { transform: 'scale(1.4) rotate(-8deg)', opacity: '0' },
          '70%': { transform: 'scale(0.96) rotate(-2deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-3deg)', opacity: '1' },
        },
        'blink-critical': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.25' },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(400%)' },
        },
      },
    },
  },
  plugins: [],
};
