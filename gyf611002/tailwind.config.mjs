/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        ice: {
          50:  '#F0F9FF',
          100: '#E0F2FE',
          200: '#BAE6FD',
          300: '#7DD3FC',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
          700: '#0369A1',
          800: '#075985',
          900: '#0C4A6E',
          950: '#082F49'
        },
        frost: '#E0F2FE',
        deepsea: '#164E63'
      },
      fontFamily: {
        display: ['Orbitron', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      boxShadow: {
        ice: '0 0 0 1px rgba(14,165,233,0.3), 0 10px 40px -12px rgba(14,165,233,0.35)'
      },
      keyframes: {
        pulse2x: { '0%,100%': {opacity:1}, '50%': {opacity:0.35} }
      },
      animation: {
        pulse2x: 'pulse2x 1.2s ease-in-out infinite'
      }
    }
  },
  plugins: []
};
