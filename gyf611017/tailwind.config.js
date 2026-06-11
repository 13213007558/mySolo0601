/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: false,
  },
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        'diamond-navy': '#0F172A',
        'diamond-gold': '#D4AF37',
        'diamond-silver': '#E2E8F0',
        'diamond-cream': '#F8FAFC',
        'inclusion-crystal': '#DC2626',
        'inclusion-feather': '#059669',
        'inclusion-cloud': '#64748B',
        'inclusion-needle': '#2563EB',
        'inclusion-cavity': '#9333EA',
        'inclusion-chip': '#EA580C',
        'inclusion-cleavage': '#DB2777',
        'inclusion-grain': '#0891B2',
      },
      fontFamily: {
        'display': ['"Playfair Display"', 'serif'],
        'body': ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-gold': 'glowGold 2s ease-in-out infinite',
        'ripple': 'ripple 0.6s ease-out',
        'slide-in-left': 'slideInLeft 0.5s ease-out',
        'slide-in-right': 'slideInRight 0.5s ease-out',
        'slide-in-up': 'slideInUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'pop-in': 'popIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'sparkle': 'sparkle 1.5s ease-in-out infinite',
      },
      keyframes: {
        glowGold: {
          '0%, 100%': { boxShadow: '0 0 5px #D4AF37, 0 0 10px #D4AF37' },
          '50%': { boxShadow: '0 0 20px #D4AF37, 0 0 30px #D4AF37, 0 0 40px #D4AF37' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '1' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
        slideInLeft: {
          '0%': { transform: 'translateX(-30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(30px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        popIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        sparkle: {
          '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
};
